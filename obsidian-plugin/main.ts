import {
    App,
    ButtonComponent,
    MarkdownRenderer,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
    requestUrl,
} from 'obsidian';

interface QuickliSettings {
    baseUrl: string;
    username: string;
    appPassword: string;
    defaultExpiry: string;
    uploadLocalImages: boolean;
    openAfterShare: boolean;
}

interface ShareRecord {
    shareId: number;
    url: string;
    passwordProtected: boolean;
    expiresAt?: number | null;
    updatedAt: number;
}

interface QuickliPersistedData {
    settings: QuickliSettings;
    shares: Record<string, ShareRecord>;
}

const DEFAULT_SETTINGS: QuickliSettings = {
    baseUrl: 'https://quickli.net',
    username: '',
    appPassword: '',
    defaultExpiry: '7 days',
    uploadLocalImages: false,
    openAfterShare: true,
};

export default class QuickliSharePlugin extends Plugin {
    settings: QuickliSettings;
    data: QuickliPersistedData;
    statusBarItem?: HTMLElement;

    async onload() {
        const stored = (await this.loadData()) as QuickliPersistedData || { settings: DEFAULT_SETTINGS, shares: {} };
        this.settings = Object.assign({}, DEFAULT_SETTINGS, stored.settings || {});
        this.data = {
            settings: this.settings,
            shares: stored.shares || {},
        };

        this.addSettingTab(new QuickliSettingTab(this.app, this));

        this.addCommand({
            id: 'quickli-share-note',
            name: 'Share note',
            callback: () => this.openShareOptions(),
        });

        this.addCommand({
            id: 'quickli-copy-share-url',
            name: 'Copy share URL',
            callback: () => this.copyShareUrl(),
        });

        this.addCommand({
            id: 'quickli-update-password',
            name: 'Set or clear share password',
            callback: () => this.openPasswordModal(),
        });

        this.addCommand({
            id: 'quickli-revoke-share',
            name: 'Revoke share',
            callback: () => this.revokeShare(),
        });

        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.addEventListener('click', () => {
            const file = this.app.workspace.getActiveFile();
            const record = file ? this.data.shares[file.path] : undefined;
            if (record) {
                new ShareResultModal(this.app, record.url, record.passwordProtected).open();
            } else {
                this.openShareOptions();
            }
        });

        this.registerEvent(this.app.workspace.on('file-open', (file) => {
            this.updateStatusBar(file || null);
        }));

        this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
            if (!(file instanceof TFile)) {
                return;
            }
            menu.addItem((item) => {
                item.setTitle('Share via Quickli')
                    .setIcon('share')
                    .onClick(() => this.openShareOptions(file));
            });
        }));

        this.updateStatusBar(this.app.workspace.getActiveFile());
    }

    onunload() {
        this.statusBarItem?.remove();
    }

    async saveSettings() {
        this.data.settings = this.settings;
        await this.saveData(this.data);
    }

    private async saveShareData() {
        this.data.settings = this.settings;
        await this.saveData(this.data);
    }

    private updateStatusBar(file: TFile | null) {
        if (!this.statusBarItem) {
            return;
        }
        if (!file) {
            this.statusBarItem.setText('Quickli: No file');
            return;
        }
        const record = this.data.shares[file.path];
        if (!record) {
            this.statusBarItem.setText('Quickli: Not shared');
            return;
        }
        const lock = record.passwordProtected ? '🔒' : '🌐';
        const expires = record.expiresAt ? ` · expires ${new Date(record.expiresAt * 1000).toLocaleDateString()}` : '';
        this.statusBarItem.setText(`Quickli: Shared ${lock}${expires}`);
    }

    private async openShareOptions(file?: TFile) {
        const target = file || this.app.workspace.getActiveFile();
        if (!target) {
            new Notice('No active file to share.');
            return;
        }
        new ShareOptionsModal(this.app, this, target).open();
    }

    private async copyShareUrl() {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice('No active file.');
            return;
        }
        const record = this.data.shares[file.path];
        if (!record) {
            new Notice('This note has not been shared yet.');
            return;
        }
        await this.copyToClipboard(record.url);
        new Notice('Share URL copied.');
    }

    private async openPasswordModal() {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice('No active file.');
            return;
        }
        const record = this.data.shares[file.path];
        if (!record) {
            new Notice('This note has not been shared yet.');
            return;
        }
        new PasswordModal(this.app, this, file, record).open();
    }

    async shareNote(file: TFile, options: { password?: string; expiresIn?: string; clearExpiry?: boolean }) {
        if (!this.settings.baseUrl || !this.settings.username || !this.settings.appPassword) {
            new Notice('Quickli settings are incomplete.');
            return;
        }

        const record = this.data.shares[file.path];
        const markdown = await this.app.vault.read(file);
        const processed = this.settings.uploadLocalImages
            ? await this.replaceLocalImages(markdown, file.path)
            : markdown;
        const html = await this.renderMarkdownToHtml(processed, file.path);

        const payload: Record<string, unknown> = {
            title: file.basename,
            content_html: html,
            content_md: processed,
            note_path: file.path,
        };

        if (record) {
            payload.share_id = record.shareId;
        }

        if (options.clearExpiry) {
            payload.expires_at = 0;
        } else {
            const expiresValue = options.expiresIn || this.settings.defaultExpiry;
            if (expiresValue) {
                payload.expires_in = expiresValue;
            }
        }

        if (typeof options.password === 'string') {
            payload.password = options.password;
        }

        try {
            const response = await this.requestJson(`${this.apiBase()}/share`, 'POST', payload);
            const updated: ShareRecord = {
                shareId: response.share_id,
                url: response.url,
                passwordProtected: Boolean(response.password_protected),
                expiresAt: response.expires_at ?? null,
                updatedAt: Date.now(),
            };

            this.data.shares[file.path] = updated;
            await this.saveShareData();
            this.updateStatusBar(file);

            new ShareResultModal(this.app, updated.url, updated.passwordProtected).open();
            if (this.settings.openAfterShare) {
                window.open(updated.url, '_blank');
            }
        } catch (error) {
            new Notice(`Share failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async revokeShare() {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice('No active file.');
            return;
        }
        const record = this.data.shares[file.path];
        if (!record) {
            new Notice('This note has not been shared yet.');
            return;
        }

        try {
            await this.requestJson(`${this.apiBase()}/share/${record.shareId}`, 'DELETE');
            delete this.data.shares[file.path];
            await this.saveShareData();
            this.updateStatusBar(file);
            new Notice('Share revoked.');
        } catch (error) {
            new Notice(`Failed to revoke: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updatePassword(file: TFile, password: string) {
        const record = this.data.shares[file.path];
        if (!record) {
            new Notice('This note has not been shared yet.');
            return;
        }

        try {
            const response = await this.requestJson(`${this.apiBase()}/share`, 'POST', {
                share_id: record.shareId,
                password,
            });
            record.passwordProtected = Boolean(response.password_protected);
            record.url = response.url;
            record.updatedAt = Date.now();
            this.data.shares[file.path] = record;
            await this.saveShareData();
            this.updateStatusBar(file);
            new ShareResultModal(this.app, record.url, record.passwordProtected).open();
        } catch (error) {
            new Notice(`Password update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async renderMarkdownToHtml(markdown: string, sourcePath: string): Promise<string> {
        const container = document.createElement('div');
        await MarkdownRenderer.render(this.app, markdown, container, sourcePath, this);
        return container.innerHTML;
    }

    private async replaceLocalImages(markdown: string, sourcePath: string): Promise<string> {
        const replacements: Array<{ original: string; replacement: string }> = [];
        const uploadCache = new Map<string, string>();

        const wikilinkRegex = /!\[\[([^\]]+)\]\]/g;
        const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

        for (const match of markdown.matchAll(wikilinkRegex)) {
            const raw = match[0];
            const target = match[1].split('|')[0].split('#')[0].trim();
            if (!target) {
                continue;
            }
            const url = await this.resolveImageUrl(target, sourcePath, uploadCache);
            if (url) {
                replacements.push({ original: raw, replacement: `![](${url})` });
            }
        }

        for (const match of markdown.matchAll(markdownRegex)) {
            const raw = match[0];
            const alt = match[1];
            const target = match[2].trim();
            if (this.isRemoteUrl(target)) {
                continue;
            }
            const url = await this.resolveImageUrl(target, sourcePath, uploadCache);
            if (url) {
                replacements.push({ original: raw, replacement: `![${alt}](${url})` });
            }
        }

        let processed = markdown;
        for (const replacement of replacements) {
            processed = processed.replace(replacement.original, replacement.replacement);
        }
        return processed;
    }

    private async resolveImageUrl(path: string, sourcePath: string, uploadCache: Map<string, string>): Promise<string | null> {
        if (this.isRemoteUrl(path)) {
            return path;
        }

        const file = this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
        if (!file || !(file instanceof TFile)) {
            return null;
        }

        if (!this.isImageFile(file.extension)) {
            return null;
        }

        if (uploadCache.has(file.path)) {
            return uploadCache.get(file.path) || null;
        }

        const url = await this.uploadMedia(file);
        if (url) {
            uploadCache.set(file.path, url);
        }
        return url;
    }

    private isImageFile(extension: string): boolean {
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension.toLowerCase());
    }

    private isRemoteUrl(value: string): boolean {
        return /^(https?:|data:|file:)/i.test(value);
    }

    private async uploadMedia(file: TFile): Promise<string | null> {
        const buffer = await this.app.vault.readBinary(file);
        const url = `${this.baseUrl()}/wp-json/wp/v2/media`;
        const mime = this.mimeForExtension(file.extension);

        try {
            const response = await requestUrl({
                url,
                method: 'POST',
                headers: {
                    Authorization: this.authHeader(),
                    'Content-Type': mime,
                    'Content-Disposition': `attachment; filename="${file.name}"`,
                },
                body: buffer,
            });

            return response.json?.source_url || null;
        } catch (error) {
            new Notice(`Image upload failed for ${file.name}.`);
            return null;
        }
    }

    private mimeForExtension(extension: string): string {
        switch (extension.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            case 'svg':
                return 'image/svg+xml';
            default:
                return 'application/octet-stream';
        }
    }

    private authHeader(): string {
        const pass = this.settings.appPassword.replace(/\s+/g, '');
        const token = btoa(`${this.settings.username}:${pass}`);
        return `Basic ${token}`;
    }

    private baseUrl(): string {
        return this.settings.baseUrl.replace(/\/+$/, '');
    }

    private apiBase(): string {
        return `${this.baseUrl()}/wp-json/quickli-share/v1`;
    }

    private async requestJson(url: string, method: string, body?: Record<string, unknown>): Promise<any> {
        const response = await requestUrl({
            url,
            method,
            headers: {
                Authorization: this.authHeader(),
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status >= 400) {
            throw new Error(response.text || `HTTP ${response.status}`);
        }
        return response.json;
    }

    private async copyToClipboard(text: string) {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }
}

class ShareOptionsModal extends Modal {
    plugin: QuickliSharePlugin;
    file: TFile;

    constructor(app: App, plugin: QuickliSharePlugin, file: TFile) {
        super(app);
        this.plugin = plugin;
        this.file = file;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Share note via Quickli' });

        const passwordInput = contentEl.createEl('input', {
            type: 'password',
            placeholder: 'Password (optional)',
        });
        passwordInput.addClass('quickli-input');

        const expiryInput = contentEl.createEl('input', {
            type: 'text',
            placeholder: `Expiry (e.g., ${this.plugin.settings.defaultExpiry || '7 days'})`,
        });
        expiryInput.addClass('quickli-input');

        const expiryToggleWrap = contentEl.createDiv({ cls: 'quickli-toggle' });
        const expiryToggle = expiryToggleWrap.createEl('input', { type: 'checkbox' });
        expiryToggleWrap.createEl('label', { text: 'No expiry for this share' });
        expiryToggle.addEventListener('change', () => {
            expiryInput.disabled = expiryToggle.checked;
        });

        const actions = contentEl.createDiv({ cls: 'quickli-actions' });
        const shareButton = new ButtonComponent(actions)
            .setButtonText('Share')
            .setCta()
            .onClick(async () => {
                this.close();
                await this.plugin.shareNote(this.file, {
                    password: passwordInput.value,
                    expiresIn: expiryInput.value,
                    clearExpiry: expiryToggle.checked,
                });
            });

        new ButtonComponent(actions)
            .setButtonText('Cancel')
            .onClick(() => this.close());

        shareButton.buttonEl.focus();
    }
}

class ShareResultModal extends Modal {
    url: string;
    passwordProtected: boolean;

    constructor(app: App, url: string, passwordProtected: boolean) {
        super(app);
        this.url = url;
        this.passwordProtected = passwordProtected;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Share ready' });
        contentEl.createEl('p', {
            text: this.passwordProtected ? 'Password protected 🔒' : 'Public unlisted link 🌐',
        });

        const urlInput = contentEl.createEl('input', {
            type: 'text',
            value: this.url,
        });
        urlInput.addClass('quickli-input');

        const actions = contentEl.createDiv({ cls: 'quickli-actions' });
        new ButtonComponent(actions)
            .setButtonText('Copy URL')
            .setCta()
            .onClick(async () => {
                if (navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(this.url);
                }
                new Notice('Copied to clipboard.');
            });

        new ButtonComponent(actions)
            .setButtonText('Open')
            .onClick(() => window.open(this.url, '_blank'));

        new ButtonComponent(actions)
            .setButtonText('Email')
            .onClick(() => window.open(`mailto:?subject=Shared note&body=${encodeURIComponent(this.url)}`));

        urlInput.select();
    }
}

class PasswordModal extends Modal {
    plugin: QuickliSharePlugin;
    file: TFile;
    record: ShareRecord;

    constructor(app: App, plugin: QuickliSharePlugin, file: TFile, record: ShareRecord) {
        super(app);
        this.plugin = plugin;
        this.file = file;
        this.record = record;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Update share password' });

        const passwordInput = contentEl.createEl('input', {
            type: 'password',
            placeholder: 'Enter a password (leave blank to clear)',
        });
        passwordInput.addClass('quickli-input');

        const actions = contentEl.createDiv({ cls: 'quickli-actions' });
        new ButtonComponent(actions)
            .setButtonText('Save')
            .setCta()
            .onClick(async () => {
                this.close();
                await this.plugin.updatePassword(this.file, passwordInput.value || '');
            });
        new ButtonComponent(actions)
            .setButtonText('Cancel')
            .onClick(() => this.close());
    }
}

class QuickliSettingTab extends PluginSettingTab {
    plugin: QuickliSharePlugin;

    constructor(app: App, plugin: QuickliSharePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Quickli Share settings' });

        new Setting(containerEl)
            .setName('WordPress site URL')
            .setDesc('Base URL of your WordPress site, e.g. https://quickli.net')
            .addText((text) =>
                text
                    .setPlaceholder('https://quickli.net')
                    .setValue(this.plugin.settings.baseUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.baseUrl = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('WordPress username')
            .addText((text) =>
                text
                    .setPlaceholder('username')
                    .setValue(this.plugin.settings.username)
                    .onChange(async (value) => {
                        this.plugin.settings.username = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('WordPress application password')
            .setDesc('Create an application password in WordPress and paste it here.')
            .addText((text) =>
                text
                    .setPlaceholder('xxxx xxxx xxxx xxxx xxxx xxxx')
                    .setValue(this.plugin.settings.appPassword)
                    .onChange(async (value) => {
                        this.plugin.settings.appPassword = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Default expiry')
            .setDesc('Examples: "7 days", "12 hours". Leave blank for no expiry.')
            .addText((text) =>
                text
                    .setPlaceholder('7 days')
                    .setValue(this.plugin.settings.defaultExpiry)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultExpiry = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Upload local images')
            .setDesc('Uploads local images to WordPress Media before sharing.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.uploadLocalImages).onChange(async (value) => {
                    this.plugin.settings.uploadLocalImages = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Open share after upload')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.openAfterShare).onChange(async (value) => {
                    this.plugin.settings.openAfterShare = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}

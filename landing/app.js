(() => {
  const translations = {
    en: {
      "meta.title": "Quickli - Share Obsidian notes as unlisted web pages",
      "meta.description": "Quickli pairs an Obsidian plugin with a WordPress plugin so you can share notes as unlisted pages, add passwords, set expiry, and revoke links in seconds.",
      "nav.install": "Install",
      "nav.source": "Source",
      "hero.eyebrow": "Share. Protect. Revoke.",
      "hero.title": "Turn any Obsidian note into a private web link.",
      "hero.sub": "Quickli pairs an Obsidian plugin with a WordPress plugin so you can publish notes as unlisted pages, add passwords, set expiry, and revoke links without leaving your vault.",
      "hero.ctaPrimary": "Download Obsidian plugin",
      "hero.ctaSecondary": "See workflow",
      "hero.microcopy": "Use your own WordPress site. No hosted Quickli account, no separate publishing dashboard.",
      "shots.realViews": "Real product views",
      "shots.zoomHint": "Click screenshots to zoom",
      "label.shared": "Shared page",
      "label.modal": "Share modal",
      "label.settings": "Settings",
      "alt.shared": "Quickli shared note page screenshot",
      "alt.modal": "Quickli share modal screenshot",
      "alt.settings": "Quickli settings screenshot",
      "alt.sharedFull": "Quickli shared page full screenshot",
      "alt.modalFull": "Quickli share modal full screenshot",
      "alt.settingsFull": "Quickli settings full screenshot",
      "alt.thumbSettings": "Quickli settings thumbnail screenshot",
      "alt.thumbModal": "Quickli share modal thumbnail screenshot",
      "alt.thumbShared": "Quickli shared page thumbnail screenshot",
      "alt.zoom": "Enlarged screenshot preview",
      "steps.title": "Start in 3 steps",
      "steps.sub": "Quickli is not a SaaS app. It is a small bridge between your Obsidian vault and your own WordPress site.",
      "steps.one.num": "Step 01",
      "steps.one.title": "Install the WordPress plugin",
      "steps.one.body": "Upload the Quickli Share ZIP in WordPress and activate it. That gives your site the unlisted share route and REST API.",
      "steps.two.num": "Step 02",
      "steps.two.title": "Add the Obsidian plugin",
      "steps.two.body": "Copy the plugin folder into your vault's Community Plugins directory, enable it, and enter your WordPress application password.",
      "steps.three.num": "Step 03",
      "steps.three.title": "Share and control the link",
      "steps.three.body": "Publish a note, add a password or expiry if needed, then copy, open, update, or revoke the share directly from Obsidian.",
      "install.title": "Install both sides cleanly",
      "install.sub": "Quickli has one ZIP for WordPress and one ZIP for Obsidian. Use both if you want the full flow shown on this page.",
      "install.wp.kicker": "WordPress",
      "install.wp.title": "Quickli Share plugin",
      "install.wp.body": "Installs the REST endpoint, unlisted `/q/<token>/` pages, expiry cleanup, and vault redirect support on your own site.",
      "install.wp.cta": "Download WordPress plugin",
      "install.wp.one": "In WordPress, open Plugins -> Add New Plugin -> Upload Plugin.",
      "install.wp.two": "Choose `quickli-wordpress-plugin.zip` and activate it.",
      "install.wp.three": "Create an Application Password for the user that should manage shares.",
      "install.obs.kicker": "Obsidian",
      "install.obs.title": "Quickli Share plugin",
      "install.obs.body": "Adds the share modal, share status, password updates, revoke action, and optional local image uploads inside Obsidian.",
      "install.obs.cta": "Download Obsidian plugin",
      "install.obs.one": "Unzip the download into `.obsidian/plugins/quickli-share/` in your vault.",
      "install.obs.two": "Enable Quickli Share in Community Plugins.",
      "install.obs.three": "Add your site URL, username, and WordPress application password in Settings.",
      "workflow.title": "See the workflow clearly",
      "workflow.sub": "These are real sanitized product views from the repository. They show the setup, the share modal, and the resulting reading page.",
      "workflow.settings.title": "Connect your site once",
      "workflow.settings.body": "Add the base URL, username, application password, default expiry, and media upload preferences in the plugin settings.",
      "workflow.settings.caption": "Obsidian settings · site connection and defaults",
      "workflow.modal.title": "Share without leaving the note",
      "workflow.modal.body": "Open the modal, set an optional password, choose expiry, or leave the share open-ended if the note should stay available.",
      "workflow.modal.caption": "Share modal · password and expiry control",
      "workflow.page.title": "Deliver a clean reading page",
      "workflow.page.body": "Readers get an uncluttered note page instead of a blog post shell. You keep the source in Obsidian and control access from there.",
      "workflow.page.caption": "Shared page · reading view on your WordPress site",
      "security.kicker": "Security + control",
      "security.title": "Built for private note sharing, not public publishing.",
      "security.lede": "Quickli keeps the authoring workflow in Obsidian and uses your own WordPress site only as the delivery layer. The share path stays lightweight and reversible.",
      "security.one": "Unlisted tokenized URLs instead of indexed public posts",
      "security.two": "Optional password protection for each shared note",
      "security.three": "Optional expiry with cleanup for outdated shares",
      "security.four": "Noindex headers on share pages",
      "security.five": "Revoke links directly from Obsidian",
      "security.six": "Optional upload of local images before publish",
      "security.statOne": "small plugins instead of a hosted platform",
      "security.statTwo": "core share controls: unlisted, password, expiry, revoke",
      "faq.title": "FAQ + screenshot gallery",
      "faq.one.q": "Do I need Quickli hosting to use this?",
      "faq.one.a": "No. Quickli uses your own WordPress site and your own Obsidian vault. There is no separate hosted Quickli account in this repo.",
      "faq.two.q": "Can I self-host everything?",
      "faq.two.a": "Yes. The WordPress plugin runs on your site, the Obsidian plugin runs locally in your vault, and the source code is in the public GitHub repo.",
      "faq.three.q": "What happens to local images inside a note?",
      "faq.three.a": "If you enable image upload, Quickli uploads local images to the WordPress Media library before publishing and replaces the links in the shared output.",
      "faq.four.q": "Can I update or revoke a link later?",
      "faq.four.a": "Yes. Existing shares can be updated, password state can change, and links can be revoked from Obsidian without creating duplicates.",
      "faq.five.q": "Is the current quickli.net homepage already this landing page?",
      "faq.five.a": "No. The current quickli.net root still serves an older WordPress homepage. This Pages-based landing page is the new product-facing version.",
      "repo.title": "Source code",
      "repo.cta": "Open GitHub repo",
      "footer.tagline": "Quickli • Obsidian to WordPress sharing without a hosted middle layer",
      "modal.close": "Close"
    },
    de: {
      "meta.title": "Quickli - Obsidian-Notizen als ungelistete Web-Seiten teilen",
      "meta.description": "Quickli kombiniert ein Obsidian-Plugin mit einem WordPress-Plugin, damit du Notizen als ungelistete Seiten teilen, mit Passwort schützen, befristen und wieder zurückziehen kannst.",
      "nav.install": "Installieren",
      "nav.source": "Source",
      "hero.eyebrow": "Teilen. Schützen. Widerrufen.",
      "hero.title": "Mach aus jeder Obsidian-Notiz einen privaten Web-Link.",
      "hero.sub": "Quickli kombiniert ein Obsidian-Plugin mit einem WordPress-Plugin, damit du Notizen als ungelistete Seiten veröffentlichen, mit Passwort schützen, befristen und widerrufen kannst, ohne dein Vault zu verlassen.",
      "hero.ctaPrimary": "Obsidian-Plugin laden",
      "hero.ctaSecondary": "Workflow ansehen",
      "hero.microcopy": "Nutze deine eigene WordPress-Seite. Kein gehosteter Quickli-Account, kein separates Publishing-Dashboard.",
      "shots.realViews": "Echte Produktansichten",
      "shots.zoomHint": "Klicke auf Screenshots zum Zoomen",
      "label.shared": "Geteilte Seite",
      "label.modal": "Share-Modal",
      "label.settings": "Einstellungen",
      "alt.shared": "Quickli Screenshot der geteilten Notizseite",
      "alt.modal": "Quickli Screenshot des Share-Modals",
      "alt.settings": "Quickli Screenshot der Einstellungen",
      "alt.sharedFull": "Quickli vollständiger Screenshot der geteilten Seite",
      "alt.modalFull": "Quickli vollständiger Screenshot des Share-Modals",
      "alt.settingsFull": "Quickli vollständiger Screenshot der Einstellungen",
      "alt.thumbSettings": "Quickli Thumbnail der Einstellungen",
      "alt.thumbModal": "Quickli Thumbnail des Share-Modals",
      "alt.thumbShared": "Quickli Thumbnail der geteilten Seite",
      "alt.zoom": "Vergrößerte Screenshot-Vorschau",
      "steps.title": "Start in 3 Schritten",
      "steps.sub": "Quickli ist kein SaaS-Tool. Es ist eine kleine Brücke zwischen deinem Obsidian-Vault und deiner eigenen WordPress-Seite.",
      "steps.one.num": "Schritt 01",
      "steps.one.title": "WordPress-Plugin installieren",
      "steps.one.body": "Lade das Quickli-Share-ZIP in WordPress hoch und aktiviere es. Dadurch bekommt deine Seite die ungelistete Share-Route und die REST API.",
      "steps.two.num": "Schritt 02",
      "steps.two.title": "Obsidian-Plugin hinzufügen",
      "steps.two.body": "Kopiere den Plugin-Ordner in das Community-Plugins-Verzeichnis deines Vaults, aktiviere ihn und hinterlege dein WordPress Application Password.",
      "steps.three.num": "Schritt 03",
      "steps.three.title": "Notiz teilen und verwalten",
      "steps.three.body": "Veröffentliche eine Notiz, setze bei Bedarf Passwort oder Ablaufdatum und kopiere, öffne, aktualisiere oder widerrufe den Share direkt aus Obsidian.",
      "install.title": "Beide Seiten sauber installieren",
      "install.sub": "Quickli hat ein ZIP für WordPress und ein ZIP für Obsidian. Nutze beide, wenn du den kompletten Flow dieser Seite möchtest.",
      "install.wp.kicker": "WordPress",
      "install.wp.title": "Quickli Share Plugin",
      "install.wp.body": "Installiert den REST-Endpunkt, ungelistete `/q/<token>/`-Seiten, Expiry-Cleanup und Vault-Redirect-Support auf deiner eigenen Seite.",
      "install.wp.cta": "WordPress-Plugin laden",
      "install.wp.one": "Öffne in WordPress Plugins -> Neues Plugin -> Plugin hochladen.",
      "install.wp.two": "Wähle `quickli-wordpress-plugin.zip` und aktiviere es.",
      "install.wp.three": "Erstelle ein Application Password für den Benutzer, der Shares verwalten soll.",
      "install.obs.kicker": "Obsidian",
      "install.obs.title": "Quickli Share Plugin",
      "install.obs.body": "Fügt das Share-Modal, den Share-Status, Passwort-Updates, Widerrufen und optionale Uploads lokaler Bilder direkt in Obsidian hinzu.",
      "install.obs.cta": "Obsidian-Plugin laden",
      "install.obs.one": "Entpacke den Download nach `.obsidian/plugins/quickli-share/` in deinem Vault.",
      "install.obs.two": "Aktiviere Quickli Share in den Community Plugins.",
      "install.obs.three": "Hinterlege Site-URL, Benutzername und WordPress Application Password in den Einstellungen.",
      "workflow.title": "Den Workflow klar sehen",
      "workflow.sub": "Das sind echte bereinigte Produktansichten aus dem Repository. Sie zeigen Setup, Share-Modal und die fertige Leseseite.",
      "workflow.settings.title": "Deine Seite einmal verbinden",
      "workflow.settings.body": "Hinterlege Base URL, Benutzername, Application Password, Standard-Expiry und Upload-Einstellungen in den Plugin-Settings.",
      "workflow.settings.caption": "Obsidian-Einstellungen · Seitenverbindung und Defaults",
      "workflow.modal.title": "Teilen, ohne die Notiz zu verlassen",
      "workflow.modal.body": "Öffne das Modal, setze optional ein Passwort, wähle ein Ablaufdatum oder lasse den Share offen, wenn die Notiz länger verfügbar bleiben soll.",
      "workflow.modal.caption": "Share-Modal · Passwort- und Expiry-Kontrolle",
      "workflow.page.title": "Eine saubere Leseseite ausliefern",
      "workflow.page.body": "Leser bekommen eine ruhige Notizseite statt einer Blog-Post-Hülle. Die Quelle bleibt in Obsidian und du steuerst den Zugriff von dort.",
      "workflow.page.caption": "Geteilte Seite · Leseansicht auf deiner WordPress-Seite",
      "security.kicker": "Sicherheit + Kontrolle",
      "security.title": "Für privates Note-Sharing gebaut, nicht für öffentliches Publishing.",
      "security.lede": "Quickli hält den Schreib-Workflow in Obsidian und nutzt deine eigene WordPress-Seite nur als Zustellschicht. Der Share-Pfad bleibt leichtgewichtig und reversibel.",
      "security.one": "Ungelistete tokenisierte URLs statt indexierter öffentlicher Posts",
      "security.two": "Optionaler Passwortschutz pro geteilter Notiz",
      "security.three": "Optionales Ablaufdatum mit Cleanup für veraltete Shares",
      "security.four": "Noindex-Header auf Share-Seiten",
      "security.five": "Links direkt aus Obsidian widerrufen",
      "security.six": "Optionaler Upload lokaler Bilder vor der Veröffentlichung",
      "security.statOne": "kleine Plugins statt gehosteter Plattform",
      "security.statTwo": "Kernkontrollen: ungelistet, Passwort, Expiry, Widerruf",
      "faq.title": "FAQ + Screenshot-Galerie",
      "faq.one.q": "Brauche ich Quickli-Hosting dafür?",
      "faq.one.a": "Nein. Quickli nutzt deine eigene WordPress-Seite und dein eigenes Obsidian-Vault. In diesem Repo gibt es keinen separaten gehosteten Quickli-Account.",
      "faq.two.q": "Kann ich alles selbst hosten?",
      "faq.two.a": "Ja. Das WordPress-Plugin läuft auf deiner Seite, das Obsidian-Plugin lokal in deinem Vault und der Source Code liegt im öffentlichen GitHub-Repo.",
      "faq.three.q": "Was passiert mit lokalen Bildern in einer Notiz?",
      "faq.three.a": "Wenn du den Bild-Upload aktivierst, lädt Quickli lokale Bilder vor dem Veröffentlichen in die WordPress Media Library hoch und ersetzt die Links im geteilten Output.",
      "faq.four.q": "Kann ich einen Link später aktualisieren oder widerrufen?",
      "faq.four.a": "Ja. Bestehende Shares lassen sich aktualisieren, der Passwortstatus kann geändert werden und Links lassen sich aus Obsidian widerrufen, ohne Duplikate zu erzeugen.",
      "faq.five.q": "Ist die aktuelle quickli.net-Startseite bereits diese Landingpage?",
      "faq.five.a": "Nein. Die aktuelle Root-Domain quickli.net liefert noch eine ältere WordPress-Startseite aus. Diese Pages-Landingpage ist die neue produktorientierte Version.",
      "repo.title": "Source Code",
      "repo.cta": "GitHub-Repo öffnen",
      "footer.tagline": "Quickli • Obsidian-zu-WordPress-Sharing ohne gehostete Zwischenplattform",
      "modal.close": "Schließen"
    }
  };

  const metaDescription = document.querySelector('meta[name="description"]');
  const languageButtons = document.querySelectorAll('[data-lang-choice]');
  const modal = document.getElementById('zoom-modal');
  const zoomImage = document.getElementById('zoom-image');
  const zoomLabel = document.getElementById('zoom-label');
  const closeBtn = document.getElementById('zoom-close');
  const zoomables = document.querySelectorAll('.zoomable');

  function t(lang, key) {
    return translations[lang][key] || translations.en[key] || "";
  }

  function getInitialLanguage() {
    const saved = window.localStorage.getItem("quickli-language");
    if (saved === "en" || saved === "de") return saved;

    const languages = navigator.languages || [navigator.language || "en"];
    return languages.some(language => language.toLowerCase().startsWith("de")) ? "de" : "en";
  }

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.title = t(lang, "meta.title");
    if (metaDescription) metaDescription.setAttribute("content", t(lang, "meta.description"));

    document.querySelectorAll("[data-i18n]").forEach(element => {
      element.textContent = t(lang, element.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(element => {
      element.dataset.i18nAttr.split(";").forEach(pair => {
        const parts = pair.split(":");
        if (parts.length !== 2) return;
        element.setAttribute(parts[0], t(lang, parts[1]));
      });
    });

    languageButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.langChoice === lang));
    });

    window.localStorage.setItem("quickli-language", lang);
  }

  function openModal(src, label) {
    zoomImage.src = src;
    zoomLabel.textContent = label || "Screenshot";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    zoomImage.src = "";
  }

  languageButtons.forEach(button => {
    button.addEventListener("click", () => applyLanguage(button.dataset.langChoice));
  });

  zoomables.forEach(image => {
    image.addEventListener("click", () => {
      openModal(image.getAttribute("src"), image.dataset.label || image.getAttribute("alt") || "Screenshot");
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal();
    });
  }

  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  applyLanguage(getInitialLanguage());
})();

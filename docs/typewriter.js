/**
 * @name Typewriter
 * @description A Closure Compiler friendly, minimalist client-side rewrite of Matt Boldt's Typed.js.
 * @license SEE LICENSE @ https://raw.githubusercontent.com/TeleworkInc/.LICENSE/master/LICENSE
 */

// Waits until given condition is true
window.waitUntil = (condition) => {
    var poll = (resolve) => {
        if (condition()) resolve();
        else window.requestAnimationFrame(
            () => poll(resolve)
        );
    }
    return new Promise(poll);
}

// Check if overscrolled (Safari)
window.overscrollCheck = () => !(
    document.body.scrollTop < 0 ||
    document.body.scrollTop + window.innerHeight > document.body.scrollHeight
);

window.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
window.waitForOverscrollUnlock = async() => await window.waitUntil(window.overscrollCheck);
window.randomInt = (min, max) => Math.floor(Math.random() * (max - min) ) + min;

class Typewriter {

    constructor(selector, strings, config = {}) {

        if (config["dev"])
            window["TYPEWRITER_DEBUG"] = true;

        this.selector = selector;
        this.strings = strings;
        this.config = config;

        this.string = config.default || "";
        this.loop = true;
        this.element = document.querySelector(this.selector);

        if (!this.element)
            throw "TYPEWRITER_ERROR: Selected element not found. Please check your selector.";

        this.init();
    }

    setTextContent(txt) {

        this.element.textContent = '';

        for (let char of txt)
            this.element.appendChild(
                document.createTextNode(char)
            );

        return this;
    }

    async init() {

        this.setTextContent(this.string || this.element.textContent);

        if (window.isSafari)
            this.log("[init] Safari detected. Will use overscroll lock.");

        if (this.config.cursor !== false)
            this.element.classList.add("typed-content");

        if (this.config.loop == false)
            this.loop = false;

        if (this.config.highlight)
            this.element.style.setProperty(
                "background-color",
                this.config.highlightColor || "rgba(255,255,255,0.5)"
            );

        this.string = this.element.textContent;
        return await this.run();
    }

    async pause(ms) {
        this.log("[delay] Waiting", ms, "ms");
        return new Promise(resolve => window.setTimeout(resolve, ms));
    }

    async run() {

        if (!this.strings) return this;
        this.log("[startTransitions] Starting transitions...");

        this.log("[startTransitions] got strings:", this.strings);
        for (let string of this.strings)
            await this.pause(this.config.transitionSpeed || 1300),
            await this.transition(string);

        return this.loop 
            ? await this.run() 
            : this;
    }

    async addCharacter(char) {

        this.string += char;
        window.requestAnimationFrame(() => {
            this.element.appendChild(document.createTextNode(char));
        });

        this.log("[addCharacter] Character added. Now reads:", this.string);
        return await this.pause(this.config.typeSpeed || window.randomInt(100,200));
    }

    async deleteCharacter() {

        this.string = this.string.substring(0, this.string.length - 1);
        window.requestAnimationFrame(() => {
            this.element.lastChild.remove();
        });

        this.log("[deleteCharacter] Character deleted. Now reads:", this.string);
        return await this.pause(this.config.deleteSpeed || window.randomInt(50, 100));
    }

    async addUntil(stringTo) {

        let i = 0;
        this.log("[addUntil] Adding until:", stringTo);
        for (let char of stringTo)
            if (char !== this.string[i++])
                await this.addCharacter(char);

        this.log("[addUntil] Done. Now reads:", this.string);
        return this;
    }

    async deleteUntilLcm(stringTo) {

        this.log("[deleteUntilLcm] Deleting until equal to lcm");
        while (stringTo.indexOf(this.string) == -1)
            await this.deleteCharacter();

        return this;
    }

    async transition(stringTo) {

        this.log(`[transition] this.string: '${this.string}', stringTo: '${stringTo}'`);
        
        await this.deleteUntilLcm(stringTo);
        await this.pause(500);
        await this.addUntil(stringTo);

        return this;
    }

    log(...strs) {
        if (window["TYPEWRITER_DEBUG"]) console.log(...strs);
        return this;
    }
}

// manual set on window for Closure Compiler export
window["Typewriter"] = Typewriter;

const blinkCSS = `.typed-content::after{content:"|";-webkit-animation:typed-cursor-blink 1s infinite;animation:typed-cursor-blink 1s infinite;margin-left:2px}@-webkit-keyframes typed-cursor-blink{0%{opacity:0}50%{opacity:1}100%{opacity:0}}@keyframes typed-cursor-blink{0%{opacity:0}50%{opacity:1}100%{opacity:0}}`;

const styleTag = document.createElement("style");
styleTag.innerHTML = blinkCSS;
document.body.append(styleTag);
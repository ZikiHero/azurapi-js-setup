import {JSDOM} from "jsdom";
import path from "path";
import {BASE, camelize, fetch, galleryThumbnailUrlToActualUrl} from "../utils";
import {GalleryItem, Skin, SkinInfo} from "./ship";

export async function fetchGallery(name: string, url: string): Promise<{ skins: Skin[], gallery: GalleryItem[] }> {
    let skins: Skin[] = [];
    let gallery: GalleryItem[] = [];
    let doc = new JSDOM(await fetch(BASE + "/" + url + "/Gallery", path.resolve(__dirname, '..', '..', 'web/ships.gallery/' + name + '.html'))).window.document;
    Array.from(doc.querySelectorAll(".mw-parser-output>.tabber>.tabber__section>article")).forEach(node => {
        let image;
        let tab = <HTMLElement>node;
        if (tab.querySelector(".tabber__panel")) image = {
            normal: tab.querySelector(".tabber__panel[title=Default] .shipskin-image img") ? (<HTMLImageElement>tab.querySelector(".tabber__panel[title=Default] .shipskin-image img")).src : null,
            nobg: tab.querySelector('.tabber__panel[title="Without BG"] .shipskin-image img') ? (<HTMLImageElement>tab.querySelector('.tabber__panel[title="Without BG"] .shipskin-image img')).src : null,
            cn: tab.querySelector(".tabber__panel[title=CN] .shipskin-image img") ? (<HTMLImageElement>tab.querySelector(".tabber__panel[title=CN] .shipskin-image img")).src : null
        };
        else image = tab.querySelector(".shipskin-image img") ? (<HTMLImageElement>tab.querySelector(".shipskin-image img")).src : null;
        let info: SkinInfo = {live2dModel: false, obtainedFrom: ""};
        tab.querySelectorAll(".shipskin-table tr").forEach(row => {
            let key = camelize(row.getElementsByTagName("th")[0].textContent.toLowerCase().trim());
            let value: any = row.getElementsByTagName("td")[0].textContent.trim();
            if (key === "live2dModel") value = (value === "Yes");
            if (key === "cost") value = parseInt(value);
            // @ts-ignore
            return info[key] = value;
        });
        skins.push({
            name: tab.title,
            image: typeof (image) === "string" || (!image) ? <string>image : image.normal,
            nobg: typeof (image) === "string" || (!image) ? undefined : image.nobg,
            cn: typeof (image) === "string" || (!image) ? undefined : image.cn,
            background: tab.querySelector(".res img") ? tab.querySelector(".res img").getAttribute("src") : null,
            chibi: tab.querySelector(".shipskin-content .shipskin-chibi img") ? tab.querySelector(".shipskin-content .shipskin-chibi img").getAttribute("src") : null,
            info: info
        });
    });

    if (doc.getElementById("Artwork") && doc.getElementById("Artwork").parentElement.nextElementSibling)
        Array.from(doc.getElementById("Artwork").parentElement.nextElementSibling.children).filter(e => e.tagName === "DIV").forEach(box => gallery.push({
            description: box.lastElementChild.textContent.trim(),
            url: galleryThumbnailUrlToActualUrl(box.querySelector("img").src)
        }));
    else Array.from(doc.getElementsByClassName("gallerybox")).forEach(box => gallery.push({
        description: box.getElementsByClassName("gallerytext")[0].textContent.trim(),
        url: galleryThumbnailUrlToActualUrl(box.getElementsByTagName("img")[0].src)
    }));
    Array.from(doc.querySelectorAll(".azl-shipart-gallery .shipart-frame, .shipgirl-art-gallery .shipgirl-art-frame")).forEach(box => gallery.push({
        description: box.querySelector(".shipart-caption, .shipgirl-art-caption").textContent.trim(),
        url: galleryThumbnailUrlToActualUrl(box.getElementsByTagName("img")[0].src)
    }));
    return {
        skins: skins,
        gallery: gallery
    };
}

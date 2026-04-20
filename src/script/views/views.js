import { PAGES } from "../config";
import nav from "./nav.js";

class views {
  //   _navBtn = [...document.querySelectorAll(".nav--link")].map((btn) =>

  render(html) {
    this._container.innerHTML = "";
    this._container.innerHTML = html;
  }

  _addHandlerRender(handler) {
    const page = this._page;
    ["hashchange", "load"].forEach((ev) => {
      window.addEventListener(ev, () => {
        let hash = window.location.hash.slice(1);
        if (!hash || !PAGES.some((page) => page === hash)) {
          //console.log("INVALID HASH");
          hash = "article";
          window.location.hash = hash;
        }

        const renderFlag = handler(page, hash);
        if (renderFlag) {
          nav._renderNavBtn(hash);
        }
        //console.log(page, hash);
      });
    });
  }
}

export default views;

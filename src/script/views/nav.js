class nav {
  _nav = document.querySelector(".nav");
  _navBtnArr = [...document.querySelectorAll(".nav--link")];

  _renderNavBtn(page) {
    this._navBtnArr.forEach((btn) => {
      btn.classList.remove("nav--focus");

      if (page === btn.innerHTML.toLowerCase().trim()) {
        btn.classList.add("nav--focus");
      }
    });
  }

  _addHandlerNavBtn(handler) {
    this._nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav--link");
      if (!btn || btn.classList.contains("nav--focus")) return;

      window.location.hash = btn.innerHTML.toLowerCase().trim();
    });
  }
}

export default new nav();

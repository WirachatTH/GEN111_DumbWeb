import views from "./views.js";

class articleView extends views {
  _page = "article";
  _container = document.querySelector(".content--container");
  _list;
  _article;
  _icon = `
    <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-chevron-right-icon lucide-chevron-right"
        >
          <path d="m9 18 6-6-6-6" /></svg
        >
  `;

  _toggleList(e) {
    const btn = e.target.closest(".toggleList");
    if (!btn) return;

    this._list.classList.toggle("content--list--close");
    this._article.classList.toggle("content--article--close");
  }

  _addHandlerScroll() {
    this._list.addEventListener("click", (e) => {
      // 1. Find the clicked button
      const btn = e.target.closest(".content--btn");
      if (!btn) return;

      // 2. Extract the 'sec--x' class name to use as a target ID
      // We look for any class starting with 'sec--'
      const targetId = Array.from(btn.classList).find((cls) =>
        cls.startsWith("sec--"),
      );

      // 3. Find the element in the article with that ID
      const targetEl = this._article.querySelector(`#${targetId}`);

      if (targetEl) {
        // 4. Perform smooth scroll
        targetEl.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // 5. Update the visual focus in the sidebar
        this._updateBtnFocus(btn);
      }
    });
  }

  _updateBtnFocus(activeBtn) {
    this._list
      .querySelectorAll(".content--btn")
      .forEach((btn) => btn.classList.remove("content--btn--focus"));
    activeBtn.classList.add("content--btn--focus");
  }

  initToggle() {
    this._list = document.querySelector(".content--list");
    this._article = document.querySelector(".content--article");

    this._list.addEventListener("click", (e) => {
      this._toggleList(e);
    });

    this._addHandlerScroll();
  }
}

export default new articleView();

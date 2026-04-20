import { getJSON } from "./api.js";
import { PAGES } from "./config.js";
import nav from "./views/nav.js";
import articleView from "./views/articleView.js";
import dashboardView from "./views/dashboardView.js";
import * as model from "./model.js";

const loadRender = async function (page, hash = "article") {
  if (page !== hash) return false;

  model.state.page = page;

  if (page === "article") {
    const html = await model.loadArticle();
    articleView.render(html);
    articleView.initToggle();
    articleView._container.scrollTop = 0;
  }

  if (page === "dashboard") {
    let html = await model.loadDashboard();

    if (model.state.page !== "dashboard") return;
    dashboardView.render(html);

    const initDashUI = () => {
      if (model.state.page !== "dashboard") return;

      const scrollPos = dashboardView._container.scrollTop;
      dashboardView.buildHtml(model.state, html);
      dashboardView.initButtons(refreshHandler, showAllHandler); // ← uses handlers below

      requestAnimationFrame(() => {
        dashboardView._container.scrollTop = scrollPos;
      });
    };

    const refreshHandler = async () => {
      try {
        dashboardView.render(html);

        const refresh_btn = document.querySelector(".dash--refresh");
        const status = document.querySelector(".fetch--status");

        if (refresh_btn) refresh_btn.classList.add("dash--refresh--active");
        if (status) {
          status.style.display = "inline";
          status.innerHTML = "&ensp;&ensp;Fetching data..";
          status.style.color = "rgb(255, 145, 0)";
        }

        await model.loadResponse(true);
        if (model.state.page !== "dashboard") return;

        initDashUI();
        // main.js inside refreshHandler catch block
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("CPE Dashboard Error:", err.message);

        // 1. Immediately re-run initDashUI()
        // This will render the dashboard using the cached data currently in model.state
        initDashUI();

        // 2. NOW update the status bar to show the error
        const status = document.querySelector(".fetch--status");
        const refresh_btn = document.querySelector(".dash--refresh");

        if (refresh_btn) refresh_btn.classList.remove("dash--refresh--active");
        if (status) {
          status.style.display = "inline";
          status.innerHTML = `&ensp;&ensp;Update failed. ${
            model.state.timestamp === null ||
            model.state.timestamp === undefined ||
            model.state.timestamp === ""
              ? "No old data found."
              : `Showing data from ${new Date(
                  model.state.timestamp,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}`
          }`;
          // Using the timestamp from your state to show exactly how old the data is
          // status.innerHTML = `&ensp;&ensp;Update failed. ${()=>{
          //   if (model.state.timestamp === null || model.state.timestamp === undefined) return ;
          //   return `Showing data from ${new Date(
          //       model.state.timestamp,
          //     ).toLocaleDateString("en-US", {
          //       month: "short",
          //       day: "numeric",
          //       year: "numeric",
          //       hour: "numeric",
          //       minute: "2-digit",
          //     })}`;
          // }}`;
          status.style.color = "red";
        }
      }
    };

    const showAllHandler = () => initDashUI();

    // Lock button during initial fetch
    const refresh_btn = document.querySelector(".dash--refresh");
    if (model.state.response.length === 0 && refresh_btn) {
      refresh_btn.classList.add("dash--refresh--active");
    }

    try {
      await model.loadResponse();

      if (model.state.page !== "dashboard") return;
      initDashUI(); // attaches buttons on success
    } catch (err) {
      const refresh_btn = document.querySelector(".dash--refresh");
      const status = document.querySelector(".fetch--status");

      if (refresh_btn) refresh_btn.classList.remove("dash--refresh--active");
      if (status) {
        status.style.display = "inline";
        status.innerHTML = "&ensp;&ensp;Update failed. Please try again.";
        status.style.color = "red";
      }
      dashboardView.initButtons(refreshHandler, showAllHandler);
      console.error("CPE Dashboard Error:", err.message);
    }
  }

  return true;
};

const init = async function () {
  articleView._addHandlerRender(loadRender);
  dashboardView._addHandlerRender(loadRender);

  nav._addHandlerNavBtn();
};

init();

import views from "./views.js";
import Chart from "chart.js/auto";

class dashboardView extends views {
  _page = "dashboard";
  _data;
  _html;
  _show_all = false;
  _open_ended = ["4.2", "6.2", "9.2", "12.2"];
  _container = document.querySelector(".content--container");
  _interesting_q = ["1.", "2.", "8.", "9.1", "10."];
  _p_res_count;
  _p_last_updated;
  _p_res_total;
  _p_q_total;
  _p_res_rate;
  _dash_grid_pie;
  _dash_grid_anonymous;
  _icon_more = `<svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-chevron-down-icon lucide-chevron-down"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>`;
  _icon_less = `
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
          class="lucide lucide-chevron-up-icon lucide-chevron-up"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>`;

  _toggleSkeleton(elArr) {
    elArr.forEach((el) => el.classList.toggle("skeleton"));
  }

  _render_response(raw, show_all = false) {
    const res_container = document.createElement("div");
    res_container.classList.add("dash--grid", "dash--grid--anonymous");
    res_container.style.setProperty("--grid-cols", 1);

    raw = raw.filter(
      (res) => res !== null && res !== undefined && res !== "" && res !== " ",
    );
    const res_length = raw.length;

    let data = raw;
    if (!show_all) data = data.slice(0, 2);

    data.forEach((res) => {
      if (!res) return;
      const quote = document.createElement("q");
      quote.classList.add("dash--anonymouse--response--txt");
      quote.innerText = res;
      res_container.insertAdjacentElement("beforeend", quote);
    });

    const amount = `${data.length} out of ${res_length} results`;
    const p_amount = document.createElement("p");
    p_amount.innerText = amount;

    res_container.insertAdjacentElement("beforeend", p_amount);

    return res_container;
  }

  _renderCharts(data) {
    this._interesting_q.forEach((q) => {
      const qValues = Object.values(data.questions);
      const qIndex = qValues.findIndex((obj) => obj.num === q);
      if (qIndex === -1) return;

      const responses = data.response
        .map((res) => res[qIndex])
        .filter((val) => val);
      const counts = responses.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

      const ctx = document.getElementById(`chart-${q}`);
      if (!ctx) return;

      // 1. Check if labels are short/numeric
      const labels = Object.keys(counts);
      // A 'clean' label is a number 1-5 or a very short word (under 3 chars)
      const isCrowded = labels.some(
        (label) => isNaN(parseInt(label)) && label.length > 3,
      );

      new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              data: Object.values(counts),
              backgroundColor: [
                "#2949ee",
                "#ff6384",
                "#ffcd56",
                "#4bc0c0",
                "#9966ff",
                "#ff9f40",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            // 2. Conditionally hide the legend if it's too crowded
            legend: {
              display: !isCrowded,
              position: "bottom",
              labels: { boxWidth: 12, font: { size: 10 } },
            },
            // 3. Tooltips stay active so users can still see the text on hover
            // dashboardView.js inside _renderCharts
            tooltip: {
              enabled: true,
              callbacks: {
                // 1. Remove the automatic title to prevent duplication
                title: () => "",
                // 2. Keep your custom label logic
                label: (context) => {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  return ` ${label}: ${value} responses`;
                },
              },
            },
          },
        },
      });
    });
  }

  _renderResult(data, markupText) {
    const parser = new DOMParser();
    const dash = parser.parseFromString(markupText, "text/html");
    const status = dash.querySelector(".fetch--status");
    let flag = !data.error;

    const q_count = Object.keys(data.questions).length - 1; // Minus the timestamp key
    if (q_count < 0) flag = false;

    const res_count = data.response.length;
    const res_rate = data.rate;
    const last_updated = new Date(data.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    this._p_res_count = dash.querySelector(".dash--res-num");
    this._p_res_count.innerHTML = `Insights from ${res_count} anonymous response${res_count > 1 ? "s" : ""}`;

    this._p_last_updated = dash.querySelector(".dash--last-updated");
    this._p_last_updated.innerHTML = last_updated;

    this._p_res_total = dash.querySelector(".dash--total");
    this._p_res_total.innerHTML = res_count;

    this._p_q_total = dash.querySelector(".dash--questions");
    this._p_q_total.innerHTML = q_count;

    this._p_res_rate = dash.querySelector(".dash--rate");
    this._p_res_rate.innerHTML = `${res_rate}%`;

    this._dash_grid_pie = dash.querySelector(".dash--grid--pie");
    this._dash_grid_pie.innerHTML = "";

    this._dash_grid_anonymous = dash.querySelector(".dash--grid--anonymous");
    this._dash_grid_anonymous.innerHTML = "";

    this._interesting_q.forEach((q) => {
      const pie_container = document.createElement("div");
      const pie_header = document.createElement("h2");
      const pie_desc = document.createElement("p");
      let qIndex;

      const questionObj = Object.values(data.questions).find((obj, i) => {
        qIndex = i;
        return obj.num === q;
      });

      // DEFENSIVE GUARD: If question isn't found, skip this chart or show placeholder
      if (!questionObj || q_count < 0) {
        console.warn(`Question ${q} not found in current dataset.`);
        flag = false;
        return;
      }

      const canvas_container = document.createElement("div");
      canvas_container.style.cssText =
        "position: relative; height:200px; width:100%; margin-top: 1rem;";
      const canvas = document.createElement("canvas");
      canvas.id = `chart-${q}`;

      pie_container.classList.add("dash--grid--sub", "grid--pie");
      pie_header.classList.add("pie--header");
      pie_desc.classList.add("pie--desc");

      pie_header.innerText = Object.values(data.questions).find((obj) => {
        return obj.num === q;
      }).q;
      pie_desc.innerText = `ข้อ ${q} (คำถามที่ ${qIndex} จากทั้งหมด ${q_count} คำถาม)`;

      canvas_container.appendChild(canvas);

      pie_container.insertAdjacentElement("beforeend", pie_header);
      pie_container.insertAdjacentElement("beforeend", pie_desc);
      pie_container.insertAdjacentElement("beforeend", canvas_container);
      this._dash_grid_pie.insertAdjacentElement("beforeend", pie_container);
      // console.log(data.questions.find((obj) => obj.num === q));
    });

    this._open_ended.forEach((q) => {
      const ano_container = document.createElement("div");
      const ano_header = document.createElement("p");

      ano_container.classList.add("dash--anonymous");
      ano_header.classList.add("dash--anonymous--question");

      let qIndex;

      const questionObj = Object.values(data.questions).find((obj, i) => {
        qIndex = i;
        return obj.num === q;
      });

      // DEFENSIVE GUARD: If question isn't found, skip this chart or show placeholder
      if (!questionObj || q_count < 0) {
        console.warn(`Question ${q} not found in current dataset.`);
        flag = false;
        return;
      }

      const question_name = Object.values(data.questions).find((obj, i) => {
        return obj.num === q;
      }).q;
      ano_header.innerText = question_name.slice(question_name.indexOf(" "));
      ano_container.insertAdjacentElement("beforeend", ano_header);

      const all_response = data.response.map((obj) => obj[`${qIndex}`]);
      const res_container = this._render_response(all_response, this._show_all);

      ano_container.insertAdjacentElement("beforeend", res_container);
      this._dash_grid_anonymous.insertAdjacentElement(
        "beforeend",
        ano_container,
      );
    });

    this._toggleSkeleton([
      this._p_res_count,
      this._p_last_updated,
      this._p_res_total,
      this._p_q_total,
      this._p_res_rate,
    ]);

    const moreBtnTxt = dash.querySelector(".dash--more--text");
    const moreSvg = dash.querySelector(".dash--more--icon");

    if (moreBtnTxt) {
      if (!this._show_all) {
        moreBtnTxt.innerText = "View More Answers";
        moreSvg.innerHTML = this._icon_more;
      } else {
        moreBtnTxt.innerText = "View Less Answers";
        moreSvg.innerHTML = this._icon_less;
      }
      //moreBtnTxt.innerText = this._show_all ? "View Less" : "View More Answers";
    }

    status.innerHTML = flag
      ? "&ensp;&ensp;Data updated successfully!"
      : "&ensp;&ensp;Data failed to fetch. Please try again later.";
    status.style.color = flag ? "green" : "red";

    requestAnimationFrame(() => this._renderCharts(data));
    return dash.querySelector("body").innerHTML;
  }

  buildHtml(data, html) {
    const newHtml = this._renderResult(data, html);

    // console.log(data, newHtml);
    this.render(newHtml);
  }

  initButtons(refreshHandler, showAllHandler) {
    const refresh_btn = document.querySelector(".dash--refresh");
    const moreBtn = document.querySelector(".dash--more");

    if (refresh_btn)
      refresh_btn.addEventListener("click", () => {
        if (refresh_btn.classList.contains("dash--refresh--active")) return;
        //console.log("REFRESH");
        refreshHandler();
      });
    if (moreBtn) {
      moreBtn.addEventListener("click", () => {
        this._show_all = !this._show_all;
        showAllHandler();
      });
    }
  }
}

export default new dashboardView();

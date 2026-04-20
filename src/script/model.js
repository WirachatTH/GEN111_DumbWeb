import { getJSON, getHTML } from "./api.js";
import { API_URL } from "./config.js";
import articleURL from "url:../content/article.html";
import dashboardURL from "url:../content/dashboard.html";

let _controller;

export const state = {
  page: "article", // article, dashboard
  timestamp: "",
  questions: {},
  response: [],
  rate: 0,
  error: false,
};

const createTimeObject = function (timeString) {
  const dateObj = new Date(timeString);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * A function which should be called inside the array of responses
 * @param {*} q a question object (e.g. {question: answer})
 * @param {*} i an index of the question from each response
 * @param {*} type 0=response, 1=question, output: 0=> [{index: answer}, ...], 1=> [{index: {num: , q: }}, ...]
 * @param {*} entry an object holding each response
 * @returns
 */
const createObject = function (q, i, type, entry) {
  // Timestamp handler
  if (i == 0) {
    entry["timestamp"] =
      q[1] === "" ? null : type === 0 ? createTimeObject(q[1]) : q[0];
  }

  // Normal questions handler
  entry[`${i}`] =
    q[1] === ""
      ? null
      : type === 0
        ? q[1]
        : {
            num: q[0].slice(0, q[0].indexOf(" ")),
            q: q[0].slice(q[0].indexOf(" ") + 1),
          };
};

/**
 *
 * @param {*} data array of responses with the format of [{question: answer}, {question: answer}, ...]
 * @param {*} type 0=response, 1=question
 * @returns
 */
const createResponseObject = function (data, type = 0) {
  if (type === 1) {
    const entryArr = Object.entries(data[0]);
    const newEntry = {};

    entryArr.forEach((q, i) => {
      createObject(q, i, type, newEntry);
    });
    return newEntry;
  }

  const dataObject = data.map((entry) => {
    const entryArr = Object.entries(entry);
    const newEntry = {};
    entryArr.forEach((q, i) => {
      createObject(q, i, type, newEntry);
    });
    //console.log(newEntry);
    return newEntry;
  });
  return dataObject;
};

const _calculateGlobalRate = function () {
  // 1) Get the number of questions (excluding timestamp)
  const questionKeys = Object.keys(state.questions).filter(
    (key) => key !== "timestamp",
  );
  const totalQuestions = questionKeys.length;
  const totalRespondents = state.response.length;

  if (totalRespondents === 0 || totalQuestions === 0) return 0;

  // 2) Count every non-null/non-empty answer in the entire dataset
  const totalAnswers = state.response.reduce((acc, res) => {
    const answeredInRow = questionKeys.filter(
      (key) => res[key] !== null && res[key] !== "",
    ).length;
    return acc + answeredInRow;
  }, 0);

  // 3) Calculate percentage
  return ((totalAnswers / (totalQuestions * totalRespondents)) * 100).toFixed(
    2,
  );
};

export const loadResponse = async function (forceRefresh = false) {
  try {
    if (_controller) _controller.abort();
    _controller = new AbortController();

    // 1) Check for existing response in localStorage
    const cachedData = localStorage.getItem("surveyResult");

    if (cachedData && !forceRefresh) {
      const { timestamp, response, questions, rate } = JSON.parse(cachedData);
      state.timestamp = timestamp;
      state.response = response;
      state.questions = questions;
      state.rate = rate;
      state.error = false;

      console.log(state);
      return;
    }

    const res = await getJSON(API_URL, _controller.signal);

    state.timestamp = new Date().toISOString();
    state.response = createResponseObject(res);
    state.questions = createResponseObject(res, 1);
    state.rate = _calculateGlobalRate();

    localStorage.setItem(
      "surveyResult",
      JSON.stringify({
        timestamp: state.timestamp,
        response: state.response,
        questions: state.questions,
        rate: state.rate,
      }),
    );

    console.log(state);
    state.error = false;
  } catch (err) {
    console.error(err.message);
    state.error = true;
    throw err;
  }
};

export const loadArticle = async function () {
  try {
    const res = await fetch(articleURL);

    return await res.text();
  } catch (err) {
    console.error(err.message);
  }
};

export const loadDashboard = async function () {
  try {
    const res = await fetch(dashboardURL);

    return await res.text();
  } catch (err) {
    console.error(err.message);
  }
};

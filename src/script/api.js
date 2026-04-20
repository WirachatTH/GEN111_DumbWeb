import { API_TIMEOUT_SEC } from "./config";

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};

export const getJSON = async function (url, signal = null) {
  try {
    const res = await Promise.race([
      fetch(url, { method: "GET", redirect: "follow", signal }),
      timeout(API_TIMEOUT_SEC),
    ]);
    const data = await res.json();
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw err;
  }
};

export const getHTML = async function (url) {
  try {
    const res = await Promise.race([fetch(url), timeout(API_TIMEOUT_SEC)]);
    if (!res.ok) throw new Error("Could not load this content");

    return await res.text();
  } catch (err) {
    throw err;
  }
};

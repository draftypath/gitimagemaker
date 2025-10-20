/**
 * BG-REMOVE WEB COMPONENT
 * -----------------------
 * This file contains the complete, self-contained source code for the bg-remove component.
 * It includes all necessary dependencies to run offline.
 *
 * Original author: Addy Osmani
 * Source: https://github.com/addyosmani/bg-remove
 * Version: 1.0.2 (Bundled for local use)
 */

const a = "./models/";
const c = "https://www.unpkg.com/three@0.132.2/examples/jsm/libs/basis/".replace(
  "/examples",
  ""
);
const l = {
  locateFile: (e) => {
    // DETECTIVE CODE: This will log every file the library tries to find.
    console.log(`[DETECTIVE CODE] BG-Remove is looking for file: "${e}"`);

    switch (e) {
      case "selfie_segmentation.tflite":
        return `${a}selfie_segmentation.tflite`;
      case "selfie_segmentation_landscape.tflite":
        return `${a}selfie_segmentation_landscape.tflite`;
      case "selfie_segmentation.js.bin":
      case "selfie_segmentation.js.wasm":
      default:
        return `${a}${e}`;
    }
  },
};
let h, m;
function u(e) {
  h = e.getContext("2d");
}
function g(e, n) {
  let t = document.createElement("canvas");
  return (
    (t.width = e),
    (t.height = n),
    {
      canvas: t,
      ctx: t.getContext("2d"),
    }
  );
}
function d(e) {
  let n = g(e.width, e.height),
    t = n.ctx;
  t.drawImage(e, 0, 0, e.width, e.height);
  let o = t.getImageData(0, 0, e.width, e.height),
    r = o.data;
  for (let i = 0; i < r.length; i += 4) {
    let s = r[i] * 0.2126 + r[i + 1] * 0.7152 + r[i + 2] * 0.0722;
    (r[i] = s), (r[i + 1] = s), (r[i + 2] = s);
  }
  return t.putImageData(o, 0, 0), n.canvas;
}
function f(e) {
  return new Promise((n, t) => {
    e.toBlob(
      (o) => {
        n(o);
      },
      "image/png",
      1
    );
  });
}
async function p(e) {
  let n = g(e.width, e.height),
    t = n.ctx;
  t.drawImage(e, 0, 0);
  let o = t.getImageData(0, 0, e.width, e.height),
    r = o.data,
    i = 255;
  for (let s = 0; s < r.length; s += 4)
    r[s + 3] < i && ((r[s] = 255), (r[s + 1] = 255), (r[s + 2] = 255));
  return t.putImageData(o, 0, 0), n.canvas;
}
async function y(e, n) {
  h.save(), h.clearRect(0, 0, e.width, e.height);
  let t = d(n),
    o = g(e.width, e.height);
  return (
    (o.ctx.filter = "blur(8px)"),
    o.ctx.drawImage(t, 0, 0, o.canvas.width, o.canvas.height),
    (h.globalCompositeOperation = "source-over"),
    h.drawImage(o.canvas, 0, 0, e.width, e.height),
    (h.globalCompositeOperation = "destination-in"),
    h.drawImage(n, 0, 0, e.width, e.height),
    (h.globalCompositeOperation = "source-over"),
    h.drawImage(n, 0, 0, e.width, e.height),
    h.restore(),
    f(e)
  );
}
async function w(e, n) {
  let t = g(e.width, e.height);
  return (
    (t.ctx.globalCompositeOperation = "copy"),
    (t.ctx.filter = "blur(4px)"),
    t.ctx.drawImage(
      n,
      0,
      0,
      t.canvas.width,
      t.canvas.height,
      0,
      0,
      t.canvas.width,
      t.canvas.height
    ),
    (t.ctx.globalCompositeOperation = "source-in"),
    (t.ctx.filter = "none"),
    t.ctx.drawImage(n, 0, 0, t.canvas.width, t.canvas.height),
    h.save(),
    h.clearRect(0, 0, e.width, e.height),
    (h.globalCompositeOperation = "source-over"),
    h.drawImage(t.canvas, 0, 0),
    h.restore(),
    f(e)
  );
}
async function v(e, n) {
  return (
    h.save(),
    h.clearRect(0, 0, e.width, e.height),
    (h.globalCompositeOperation = "source-over"),
    h.drawImage(n, 0, 0, e.width, e.height),
    h.restore(),
    f(e)
  );
}
class b extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: "open",
    });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
      </style>
      <slot></slot>
    `;
  }
  static get observedAttributes() {
    return ["src"];
  }
  async attributeChangedCallback(e, n, t) {
    if (e === "src" && n !== t && t) {
      let o = await this.loadImage(t);
      this.dispatchEvent(
        new CustomEvent("bg-remove-load-start", {
          bubbles: true,
          composed: true,
          detail: o,
        })
      );
      try {
        let i = await this.removeBackground(o);
        this.dispatchEvent(
          new CustomEvent("load", {
            bubbles: true,
            composed: true,
            detail: {
              blob: i,
              image: o,
            },
          })
        );
      } catch (r) {
        this.dispatchEvent(
          new CustomEvent("error", {
            bubbles: true,
            composed: true,
            detail: r,
          })
        );
      } finally {
        this.dispatchEvent(
          new CustomEvent("bg-remove-load-end", {
            bubbles: true,
            composed: true,
            detail: o,
          })
        );
      }
    }
  }
  loadImage(e) {
    return new Promise((n, t) => {
      let o = new Image();
      (o.crossOrigin = "anonymous"),
        (o.onload = () => {
          n(o);
        }),
        (o.onerror = (r) => {
          t(r);
        }),
        (o.src = e);
    });
  }
  async removeBackground(e) {
    m = new SelfieSegmentation(l);
    let n = new Promise((i) => {
      m.onResults((s) => {
        i(s);
      });
    });
    return (
      m.send({
        image: e,
      }),
      (m.model = {
        selectionConfidence: 0.9,
      }),
      (h = document.createElement("canvas")),
      (h.width = e.width),
      (h.height = e.height),
      u(h),
      this.process(await n, e)
    );
  }
  async process(e, n) {
    let t = g(n.width, n.height);
    (t.ctx.globalCompositeOperation = "copy"),
      t.ctx.drawImage(e.segmentationMask, 0, 0, t.canvas.width, t.canvas.height);
    let o = await p(t.canvas);
    return await v(h, o), w(h, n);
  }
}
window.customElements.define("bg-remove", b);
/**
 * NodeとTypescriptの紐付けのため
 *
 * NOTE: tsconfig.json > sourceMapのコメントを外して利用する
 */
import "source-map-support/register";

import crypto from "crypto"
import express from "express";
import fs from "fs";
import helmet from "helmet";
import log4js from "log4js"
import ProcessUtil from "./utils/ProcessUtil";

log4js.configure({
  appenders: { app: {type: 'file', filename: 'logs/app.log'}},
  categories: { default: {appenders: ['app'], level: 'debug'}}
})

const logger = log4js.getLogger()

const app = express();

/**
 * Helmet
 * https://helmetjs.github.io/
 * 
 * セキュリティ関連のHTTPヘッダを設定してくれる
 */
app.use(helmet())

app.get("/", function (req, res) {
  res.send(`Hello World ${process.pid}`);
});

app.get("/event_loops", function (req, res) {
  // NOTE: 以下の記事が参考になる
  // https://blog.hiroppy.me/entry/nodejs-event-loop

  // 同期処理
  console.log("start");

  // 非同期処理 (nextTickQueue)
  process.nextTick(() => console.log("nextTickQueue"));

  // 非同期処理 (microTaskQueue)
  Promise.resolve().then(() => console.log("microTaskQueue"));

  // 非同期処理 (TimersPhase)
  setTimeout(() => console.log("TimersPhase"));

  // 非同期処理 (入れ子)
  // 1. TimerPhaseOuterが約100ms後にトリガーされる
  // 2. コンソールログの出力
  // 3. TimerPhaseInnerをイベントキューへ登録
  // 4. TimerPhaseOuterが完了 (次のフェーズへ)
  // 5. TimerPahseInnerが約200ms後にトリガーされる
  // ...
  setTimeout(() => {
    console.log("TimersPhase_outer");
    setTimeout(() => console.log("TimerPhase_inner"), 100);
  }, 100);

  // 非同期処理 (CheckPahse)
  // TODO: TimersPhaseが先に来るのなんでか調べる
  setImmediate(() => console.log("CheckPhase"));

  // 非同期処理 (nextTickQueue)
  process.nextTick(() => console.log("nextTickQueue"));

  // 同期処理
  console.log("end");

  res.send("Check console log.");
});

app.get("/promise", function (req, res) {
  const addPromise = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("Faild promise.")), 100);
    });
  };

  try {
    // Promiseの例外捕捉はcatchメソッドを使う
    addPromise().catch(() => console.log("Catch error 2."));
  } catch (err) {
    // 非同期処理なのでこちらは捕捉されない
    console.log("Catch error 1.");
  }

  res.send("Check console log.");
});

app.get("/async_await", async function (req, res) {
  const addPromise = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("Faild promise.")), 100);
    });
  };

  try {
    await addPromise();
  } catch (err) {
    // async/awaitの場合は処理完了を待機するのでこちらでtry/catchで捕捉可能
    console.log("Catch error.");
  }

  res.send("Check console log.");
});

app.get("/read_file_sync", function (req, res) {
  // ファイル読み込み (同期)
  // 非推奨: スレッド処理をブロックしてしまう可能性がある
  fs.readFileSync("dummy", "utf-8");
  ProcessUtil.printMemoryUsage();
});

app.get("/read_file", function (req, res) {
  // ファイル読み込み (非同期/ノンブロッキング)
  fs.readFile("dummy", "utf-8", () => ProcessUtil.printMemoryUsage());
});

app.get("/create_read_stream", async function (req, res) {
  // ファイル読み込み (ストリーム)
  // NOTE: 内部ではバッファが利用されている
  const stream = fs.createReadStream("dummy", {
    highWaterMark: 131072, // バッファ容量
    encoding: "utf-8",
  });

  // EventEmitterを利用する方法
  // stream.on('data', (data) => ProcessUtil.printMemoryUsage())

  // for-await-ofを利用する方法 (generatorにも利用可能)
  for await (const data of stream) {
    ProcessUtil.printMemoryUsage();
  }
});

app.get('/crypto', function (req, res) {
    const originalText = req.query.text?.toString() || "Hello world!!"
    
    const key = crypto.randomBytes(32) // 解読キー
    const iv = crypto.randomBytes(16)  // 初期化ベクトル

    // 暗号化
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    cipher.update(originalText, "utf-8", "hex")
    const encryptedText = cipher.final("hex")

    // 複合化
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    decipher.update(encryptedText, "hex", "utf-8")
    const decryptedText = decipher.final("utf-8")

    res.send(JSON.stringify({
        "encryptedText": encryptedText,
        "decryptedText": decryptedText
    }))
})

app.get('/log', function (req, res) {
  logger.trace("This is trace log.")
  logger.debug("This is debug log.")
  logger.info("This is info log.")
  logger.warn("This is warn log.")
  logger.error("This is error log.")
  logger.fatal("This is fatal log.")
  res.send("Check your log file.")
})

app.get("/throw_error", function (req, res) {
  throw new Error("Error was thrown!!");
});

app.listen(8080, function () {
  console.log(`Start server.(pid: ${process.pid})`);
});

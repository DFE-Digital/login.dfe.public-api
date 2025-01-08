const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

app.post("/users/signed-up", (req, res) => {
  const sub = req.body.sub;
  const sourceId = req.body.sourceId;
  const token = req.get("authorization");

  console.info(
    `Received callback\n  sub: ${sub}\n  sourceId: ${sourceId}\n  token: ${token ? "received" : "not provided"}`,
  );

  res.status(202).send();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.info(`Listening at http://localhost:${port}/users/signed-up`);
});

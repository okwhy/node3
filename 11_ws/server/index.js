require("dotenv").config();
const express = require("express");
const knex = require("knex")(require("./knexfile").development);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const hashPassword = (password) => bcrypt.hash(password, 10);
const verifyPassword = (password, hash) => bcrypt.compare(password, hash);
const createToken = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

// Middleware для авторизации
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Регистрация
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    await knex("users").insert({ username, password: hashedPassword });
    res.status(201).json({ message: "User registered successfully" });
  } catch {
    res.status(400).json({ message: "User already exists" });
  }
});

// Логин
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await knex("users").where({ username }).first();
  if (user && (await verifyPassword(password, user.password))) {
    const token = createToken(user);
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// Таймеры
app.get("/api/timers", authenticate, async (req, res) => {
  const timers = await knex("timers").where({ user_id: req.user.id });
  res.json(timers);
});

app.post("/api/timers", authenticate, async (req, res) => {
  const { description } = req.body;
  const timer = await knex("timers")
    .insert({
      user_id: req.user.id,
      description,
      isActive: true,
      start: Date.now(),
    })
    .returning("*");
  res.status(201).json(timer[0]);
});

app.post("/api/timers/:id/stop", authenticate, async (req, res) => {
  const { id } = req.params;
  await knex("timers").where({ id, user_id: req.user.id }).update({ isActive: false, end: Date.now() });
  res.sendStatus(204);
});
app.get("/", (req, res) => {
  res.send("Hello, this is a test response!"); // Возвращаем текстовый ответ
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

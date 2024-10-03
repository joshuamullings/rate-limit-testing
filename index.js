const express = require("express");
const rateLimit = require("express-rate-limit");
const { faker } = require("@faker-js/faker");
const config = require("dotenv").config;

config();

const app = express();
const { PORT } = process.env;

// Use to set a custom Retry-After header
let customRetryAfterHeader;
//customRetryAfterHeader = "X-Retry-After";

const rateLimiter = rateLimit({
    windowMs: 1 * 10 * 1000,
    max: 8,
    handler: function (req, res, next, options) {
        console.log(`${new Date().toISOString()}:\tRate limit exceeded for request: ${req.hostname}`);

        if (customRetryAfterHeader != null) {
            const durationSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
            res.setHeader(customRetryAfterHeader, durationSeconds);
            res.removeHeader("Retry-After");
        }

        res.status(options.statusCode).json({
            status: options.statusCode,
            message: options.message,
        });
    },
    validate: {
        xForwardedForHeader: false,
    },
});

app.use(express.json(), express.text());
app.use("/api/", rateLimiter);

app.get("/api/page", (req, res) => {
    console.log(`${new Date().toISOString()}:\tPage ${req.query.page} requested, ${req.query.pageSize} records.`);
    res.status(200).json(getRecords(req.query.pageSize));
});

function getRecords(count = 1) {
    const records = [];
    for (let i = 0; i < parseInt(count, 10); i++) {
        records.push(getRecord());
    }

    return records;
}

function getRecord() {
    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: "human" }),
        address: faker.location.streetAddress(),
    };
}

app.listen(PORT, async () => {
    console.log(`Node.js app running on localhost:${PORT}`);
});

const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'socialMedia_events';

async function connectToRabbitMQ() {
    try {
        if (connection && channel) return channel; // Return existing channel if available

        connection = await amqp.connect(process.env.RABBITMQ_URL);

        connection.on("close", async () => {
            logger.warn("RabbitMQ connection closed. Attempting to reconnect...");
            connection = null;
            channel = null;
        });

        connection.on("error", (err) => {
            logger.error("RabbitMQ connection error:", err);
        });

        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

        logger.info("Connected to RabbitMQ");
        return channel;
    } catch (error) {
        logger.error("Error connecting to RabbitMQ", error);
    }
}


async function consumeEvent(routingKey, callback) {
    try {
        const ch = await connectToRabbitMQ();
        if (!ch) {
            logger.error("Failed to establish RabbitMQ channel.");
            return;
        }

        const q = await ch.assertQueue("", { exclusive: true });
        await ch.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

        await ch.consume(q.queue, async (msg) => {
            if (msg !== null) {
                try {
                    await callback(msg.content.toString());
                    await ch.ack(msg);
                } catch (error) {
                    logger.error(`Error processing event ${routingKey}`, error);
                    ch.nack(msg, false, false); // Reject message and discard
                }
            }
        });

        logger.info(`Subscribed to event: ${routingKey}`);
    } catch (error) {
        logger.error(`Error in consumeEvent for ${routingKey}:`, error);
    }
}


module.exports = { connectToRabbitMQ, consumeEvent };
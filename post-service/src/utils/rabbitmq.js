const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'socialMedia_events';

async function connectToRabbitMQ() {
    try {
        if (connection)
            return;

        connection = await amqp.connect(process.env.RABBITMQ_URL);

        connection.on("close", () => {
            logger.warn("RabbitMQ connection closed. Reconnecting...");
            connection = null;
            channel = null;
            // setTimeout(connectToRabbitMQ, 5000); // Retry after 5 sec
        });

        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

        logger.info("Connected to rabbit mq");
        return channel;


    } catch (error) {
        logger.error("Error connecting to rabbit mq", error);
        // setTimeout(connectToRabbitMQ, 5000); // Retry on failure
    }
}

async function publishEvent(routingKey, message) {
    try {
        if (!channel)
            await connectToRabbitMQ();
        if (!channel) throw new Error("RabbitMQ channel is not available");

        channel.publish(
            EXCHANGE_NAME,
            routingKey,
            Buffer.from(JSON.stringify(message)), { persistent: true }
        );

        logger.info(`Event published : ${routingKey}`)
    }
    catch (error) {
        logger.error(`Failed to publish event: ${routingKey}`, error);

    }
}

module.exports = { connectToRabbitMQ, publishEvent };
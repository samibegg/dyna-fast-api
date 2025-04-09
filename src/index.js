import Fastify from 'fastify'
import cors from '@fastify/cors';
import { MongoClient } from 'mongodb';

const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' })
})

async function routes (fastify, options) {
  fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
  })

  // About route
  fastify.get('/about', async (request, reply) => {
    return { info: 'This is the about page' };
  });

}

export default routes;

// Use CORS middleware to allow requests from the frontend
fastify.register(cors, {
  // put your options here
})

// MongoDB connection URL
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TRADEDB_URI;
const dbName = 'trades'; 
const client = new MongoClient(url);
console.log('URL: '+url);

fastify.listen({ port: 5000 }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

// API endpoint to fetch all journeys by date range
fastify.get('/api/journeysByDate', async (request, reply) => {
  try {
    const { s, e } = request.query; // Accessing query parameters `s` and `e`
    if (!s || !e) {
      return reply.status(400).send({ error: 'Missing start or end date' });
    }
    const data = await getJourneysByDate(s, e); 
    reply.send(data);
  } catch (err) {
    reply.status(500).send({ error: 'Error fetching journeys by date' });
  }
});

async function getJourneysByDate(s, e) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('trade_journeys');

    // use startDate and endDate or default to last 30 days
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 1); 
    let startDate = s !== undefined ? new Date(s) : pastDate;
    let endDate = e !== undefined ? new Date(e) : today;

    // Fetch all timeline events between dates
    const events = await collection.find({ opening_date_time_ISO: { $gte: startDate, $lte: endDate } }).sort({ opening_date_time_ISO: 1 }).toArray();
    
    return events; 
  } catch (err) {
    console.error('Error fetching journeys by date:', err);
  } finally {
    await client.close();
  }
}

// API endpoint to fetch all orders by date range
fastify.get('/api/ordersByDate', async (request, reply) => {
  try {
    const { s, e } = request.query; // Accessing query parameters `s` and `e`
    if (!s || !e) {
      return reply.status(400).send({ error: 'Missing start or end date' });
    }
    const data = await getOrdersByDate(s, e); 
    reply.send(data);
  } catch (err) {
    reply.status(500).send({ error: 'Error orders journeys by date' });
  }
});

async function getOrdersByDate(s, e) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('orders');

    // use startDate and endDate or default to last 30 days
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 30); 
    let startDate = s !== undefined ? new Date(s) : pastDate;
    let endDate = e !== undefined ? new Date(e) : today;

    // Fetch all timeline events between dates
    const events = await collection.find({ execution_date_time_ISO: { $gte: startDate, $lte: endDate } }).toArray();
    
    return events; 
  } catch (err) {
    console.error('Error fetching orders by date:', err);
  } finally {
    await client.close();
  }
}

// API endpoint to fetch all orders by trade id
fastify.get('/api/ordersByTradeId', async (request, reply) => {
  try {
    const { i } = request.query; // Accessing query parameter `i`
    if (!i) {
      return reply.status(400).send({ error: 'Missing id' });
    }
    const data = await getOrdersByTradeId(i); 
    reply.send(data);
  } catch (err) {
    reply.status(500).send({ error: 'Error orders by ID' });
  }
});

async function getOrdersByTradeId(i) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('orders');

    // Fetch order by ID
    const order = await collection.find({ orderId: i }).toArray();
    
    return order; 
  } catch (err) {
    console.error('Error fetching orders by ID:', err);
  } finally {
    await client.close();
  }
}

// API endpoint to fetch journey
fastify.get('/api/journeyByOrderId', async (request, reply) => {
  try {
    const { j } = request.query; // Accessing query parameter `i`
    if (!j) {
      return reply.status(400).send({ error: 'Missing id' });
    }
    const data = await getJourneyByOrderId(j); 
    reply.send(data);
  } catch (err) {
    reply.status(500).send({ error: 'Error journeys by ID' });
  }
});

async function getJourneyByOrderId(j) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('trade_journeys');

    // Fetch journey by ID
    const journey = await collection.find( {related_orders_by_code: {$in: [j]}} ).toArray();
    
    return journey; 
  } catch (err) {
    console.error('Error fetching journey by order ID:', err);
  } finally {
    await client.close();
  }
}

// API endpoint to fetch all futures options
fastify.get('/api/futuresOptions', async (request, reply) => {
  try {
    const data = await getFuturesOptions(); 
    reply.send(data);
  } catch (err) {
    reply.status(500).send({ error: 'Error futures options' });
  }
});

async function getFuturesOptions() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('processed_futures_options');

    // Fetch all futures options
    const futures_options = await collection.find().toArray();
    
    return futures_options; 
  } catch (err) {
    console.error('Error fetching futures options:', err);
  } finally {
    await client.close();
  }
}

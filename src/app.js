import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes';

// Set up express app
const app = express();

// Log request to the console
app.use(logger('dev'));
app.use(cors());

//  Parse incoming request data to create body property on request object
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// List all routes
app.use('/api', routes);

export default app;

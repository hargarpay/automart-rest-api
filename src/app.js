import debug from 'debug';
import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes';

const port = process.env.PORT || 3000;

// Set the debug namespace to automart
const httpDebug = debug('automart:http');


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

app.listen(port, () => httpDebug(`Server is runing on port ${port}. Go to http://localhost:${port}`));

export default app;

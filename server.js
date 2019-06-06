import debug from 'debug';
import app from './src/app';

// Set the port from environment, if not set it 5000
const port = process.env.PORT;

// Set the debug namespace to automart
const httpDebug = debug('automart:http');

app.listen(port, () => httpDebug(`Server is runing on port ${port}. Go to http://localhost:${port}`));

export default app;

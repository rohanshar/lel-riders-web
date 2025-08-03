# LEL 2025 Riders - Enduroco.in

A React web application that displays the complete list of registered riders for London-Edinburgh-London 2025.

## Features

- 📋 Complete list of 2,008 registered riders
- 🔍 Real-time search by name or rider number
- 🔤 Sort by rider number or name
- 📱 Fully responsive design
- ⚡ Fast loading with data from AWS S3

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Data Source

Rider data is fetched from: https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/riders.json

## Technologies

- React with TypeScript
- Tailwind CSS for styling
- AWS S3 for data hosting

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

## License

This project is open source and available under the MIT License.
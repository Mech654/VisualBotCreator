# VisualBotCrafter

A highly flexible visual development environment for creating, customizing, and managing conversational bots through an intuitive node-based interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Overview

VisualBotCrafter is an Electron-based desktop application that allows users to design and implement conversational bots using a visual programming paradigm. By connecting nodes in a flow-based interface, users can create complex bot behaviors without writing code, all running locally on your machine with complete control over your data.

## Features

### Current Features
- **Flexible Visual Flow Editor**:
  - Intuitive drag-and-drop node-based interface
  - Real-time connection visualization with different styles for flow and data connections
  - Canvas navigation with pan, zoom, and grid snapping
  - Fully local operation with no cloud dependencies

- **Extensible Component System**:
  - Modular architecture allowing easy creation of new node types
  - Built-in components for conversation flow, logic operations, and data processing
  - Dynamic component discovery and registration system
  - Support for both flow-based and data-based operations via a unified port system

- **Adaptable Node Types**:
  - Conversation Flow: Start, Message, Options nodes for dialog management
  - Logic: Condition nodes for decision branching and flow control
  - Data Processing: Text manipulation, Math operations, Random value generation
  - Input/Output: User input collection with customizable validation

- **Local Project Management**:
  - Save and load bot projects on your local filesystem
  - Export to JSON format for easy backup and version control
  - No account or internet connection required

### Upcoming Features
- **Bot Testing & Deployment**:
  - Real-time bot testing within the application
  - Optional integration with popular messaging platforms
  - Local deployment options for privacy-conscious users

- **Additional Components**:
  - API integration nodes with optional connectivity
  - Local database connectivity
  - Media handling (images, audio, video)

- **Workspace Customization**:
  - Theme customization
  - Layout preferences
  - Keyboard shortcuts

## Architecture

VisualBotCrafter is built on a modular architecture designed for maximum flexibility:

- **Core Engine**: Defines the base node types, port connections, and processing logic with a plugin-based design
- **UI Layer**: Handles the visual representation and interaction with nodes, separated from business logic
- **Connection System**: Manages the relationships between nodes with support for different connection types
- **Extension System**: Allows for easy addition of new components without modifying the core codebase

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Mech654/VisualBotCrafter.git
   ```
2. Navigate to the project directory:
   ```bash
   cd VisualBotCrafter
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application in development mode:
   ```bash
   npm run dev
   ```

## Development

### Project Structure
- `/app/core`: Core node system and base classes - extend these to add functionality
- `/app/core/components`: Individual node components - add your own components here
- `/app/src/js`: Frontend application logic
- `/app/src/scss`: Styling for the application - customize the appearance
- `/app/src/js/services`: Connection, node, and drag-drop management services

### Development Workflow

When you run `npm run dev`, the following orchestrated process happens:

1. **Cleaning & Setup**: 
   - The `dist` directory is cleaned with `rimraf`
   - Development environment is set up with initial file copying

2. **Parallel Development Processes**:
   - **SASS Compilation**: SCSS files are compiled to CSS with live reloading
   - **TypeScript Compilation**: TypeScript files are watched and compiled
   - **Preload Script Building**: The Electron preload script is compiled and renamed
   - **Webpack Dev Server**: Bundles and serves the frontend code on port 4000
   - **Electron**: Launches after the webpack server is ready, with auto-restart on changes

3. **Log Filtering**:
   - A custom log filter script provides clean, organized console output with meaningful icons
   - Displays build status for different components of the application

4. **Hot Module Replacement**:
   - Frontend changes are automatically applied without full page reloads
   - Node.js code changes trigger automatic Electron restart via nodemon

### Build System

VisualBotCrafter uses a modern build system with the following technologies:

- **Webpack**: Bundles JavaScript/TypeScript, processes SCSS, and handles assets
  - Entry points for both builder and dashboard interfaces
  - Development mode with source maps and HMR (Hot Module Replacement)
  - Production mode with code optimization and minification
  - Integrated dev server with WebSocket-based live reload

- **TypeScript**: Provides static typing for improved development experience
  - Separate configurations for main process and renderer processes
  - Watch mode for immediate feedback during development

- **SASS**: Organized stylesheet architecture for maintainable styling
  - Component-based styling with modular SCSS files
  - Variables and mixins for consistent design language

### Build Commands

```bash
# Development mode with hot reloading
npm run dev

# Production build
npm run build

# Clean and rebuild everything
npm run rebuild

# Format code with Prettier
npm run format

# Run ESLint to check code quality
npm run lint

# Build specific parts
npm run sass            # Build stylesheets only
npm run webpack:build   # Build webpack bundles only
```

### Creating Custom Node Types
VisualBotCrafter includes a template system for extending the component library with custom node types. See `/app/core/TemplateNode.ts` for a detailed guide on creating new nodes.

The node creation process follows these simple steps:
1. Define a properties interface
2. Create a node class extending the base Node
3. Define metadata for UI representation
4. Add input/output ports
5. Implement processing logic

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

### Areas for Contribution
- Additional node components
- UI/UX improvements
- Documentation and examples
- Testing and bug fixes
- New feature implementations

## License

This project is licensed under the MIT License.

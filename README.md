# export_github_to_notion

This project exports GitHub issues and pull requests data to Notion.

## Prerequisites

- Docker and Docker Compose installed on your machine.
- Visual Studio Code with the Remote - Containers extension installed.

## Project Setup

1. Clone this repository.
2. Open the repository in Visual Studio Code.
3. When prompted to "Reopen in Container", click "Reopen in Container". This will start the Docker container and set up your development environment.
   - If you don't see the prompt, press `F1` to open the command palette, and then select "Remote-Containers: Reopen in Container".
4. Once the container is running, you can start working with the project.

## Project Structure

- `src/`: This is where your TypeScript (.ts) source files live. This directory could be organized further depending on the project's requirements.
- `dist/`: This is where the compiled JavaScript will be output to by the TypeScript compiler.
- `node_modules/`: This directory is where pnpm stores installed packages.
- `Dockerfile` and `docker-compose.yml`: These files are used to define your Docker configuration.
- `package.json` and `pnpm-lock.yaml`: These files are used by pnpm to track your project's dependencies.
- `tsconfig.json`: This file is used by TypeScript to control the behavior of the TypeScript compiler.

## How to Use

(TBD. Describe how to use your application, any available endpoints, any necessary configuration or environment variables, etc.)

## Contributing

(TBD. If this is a public project where you want others to contribute, provide instructions on how to do so.)

## License

(TBD. Include a short description of the license, or the full license text.)

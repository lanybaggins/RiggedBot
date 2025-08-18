# Only need to build on package changes
docker build --build-arg NODE_ENV=development -t riggedbotapp:dev -f ../discord/Dockerfile discord/

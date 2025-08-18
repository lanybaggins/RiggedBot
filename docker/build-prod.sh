# Only need to build on package changes
docker build --build-arg NODE_ENV=production -t riggedbotapp:latest -f ../discord/Dockerfile discord/

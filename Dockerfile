FROM trion/ng-cli:19.1.5 as build
LABEL authors="Letter Li"
WORKDIR /app
COPY ["package.json", "npm-shrinkwrap.json*", "./"]
RUN npm install --silent
COPY . .
ARG configuration=k8s
RUN ng build --output-path=./dist/out --configuration $configuration

FROM nginx:1.27
COPY --from=build /app/dist/out/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

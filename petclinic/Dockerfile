FROM amazoncorretto:8
ADD target/*.jar /app.jar
RUN sh -c 'touch /app.jar'
VOLUME /tmp
CMD ["java", "-jar", "/app.jar", "--spring.profiles.active=mysql", "--server.port=80"]
EXPOSE 80
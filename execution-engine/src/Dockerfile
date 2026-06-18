# execution-engine/Dockerfile
FROM ubuntu:22.04

# Avoid user interaction during apt installations
ENV DEBIAN_FRONTEND=noninteractive

# Install essential compilers and runtimes
RUN apt-get update && apt-get install -y \
    g++ \
    python3 \
    openjdk-17-jdk \
    time \
    && rm -rf /var/lib/apt/lists/*

# Create a dedicated directory for execution
WORKDIR /sandbox

# Create a non-root user for added security
RUN useradd -m sandboxuser
USER sandboxuser
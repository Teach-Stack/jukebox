# trixie, not bookworm: bookworm's WebKitGTK 2.50 fails to boot the SvelteKit app (TDZ ReferenceError)
FROM mcr.microsoft.com/devcontainers/rust:1-trixie

# Tauri v2 Linux prerequisites + JDK for Android Gradle builds
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev \
        libayatana-appindicator3-dev librsvg2-dev openjdk-21-jdk-headless unzip libclang-dev \
    && rm -rf /var/lib/apt/lists/* \
    && install -d -o vscode -g vscode -m 700 /tmp/runtime-vscode

ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
    ANDROID_HOME=/opt/android-sdk \
    NDK_HOME=/opt/android-sdk/ndk/27.3.13750724
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
# rquickjs generates its Android bindings with bindgen, which needs the NDK headers
ENV BINDGEN_EXTRA_CLANG_ARGS_aarch64_linux_android=--sysroot=$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/sysroot \
    BINDGEN_EXTRA_CLANG_ARGS_armv7_linux_androideabi=--sysroot=$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/sysroot \
    BINDGEN_EXTRA_CLANG_ARGS_i686_linux_android=--sysroot=$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/sysroot \
    BINDGEN_EXTRA_CLANG_ARGS_x86_64_linux_android=--sysroot=$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/sysroot

RUN curl -fsSLo /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip \
    && mkdir -p $ANDROID_HOME/cmdline-tools \
    && unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools \
    && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip \
    && yes | sdkmanager --licenses > /dev/null \
    && sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;27.3.13750724" \
    && chown -R vscode:vscode $ANDROID_HOME

USER vscode
RUN rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

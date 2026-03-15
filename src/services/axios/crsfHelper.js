export function getCsrfToken() {
    const name = "csrftoken";
    const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}
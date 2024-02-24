/*!
 * Start Bootstrap - Resume v7.0.6 (https://startbootstrap.com/theme/resume)
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
 */
//
// Scripts
//

window.addEventListener("DOMContentLoaded", (event) => {
  // Activate Bootstrap scrollspy on the main nav element
  const sideNav = document.body.querySelector("#sideNav");
  if (sideNav) {
    new bootstrap.ScrollSpy(document.body, {
      target: "#sideNav",
      rootMargin: "0px 0px -40%",
    });
  }

  // Collapse responsive navbar when toggler is visible
  const navbarToggler = document.body.querySelector(".navbar-toggler");
  const responsiveNavItems = [].slice.call(
    document.querySelectorAll("#navbarResponsive .nav-link")
  );
  responsiveNavItems.map(function (responsiveNavItem) {
    responsiveNavItem.addEventListener("click", () => {
      if (window.getComputedStyle(navbarToggler).display !== "none") {
        navbarToggler.click();
      }
    });
  });
});

const unixData = document.getElementsByClassName("d-unix-data");
for (var index = 0; index < unixData.length; index++) {
  try {
    let node = unixData[index];
    if (node.dataset.timestamp) {
      const currentMoment = moment(node.dataset.timestamp * 1000);
      if (node.dataset.style !== "R") {
        let format = "D MMMM YYYY hh:mm";
        switch (node.dataset.style) {
          case "F":
            format = "dddd, D MMMM YYYY hh:mm";
            break;
          case "t":
            format = "hh:mm";
            break;
          case "T":
            format = "hh:mm:ss";
            break;
          case "d":
            format = "D/MM/YYYY";
            break;
          case "D":
            format = "D MMMM YYYY";
            break;
          case "s":
            format = "MMMM YYYY";
            break;
          case "S":
            format = "MM/YYYY";
            break;
          default:
            format = "D MMMM YYYY hh:mm";
            break;
        }
        node.innerHTML = currentMoment.format(format);
      } else {
        node.dataset.livestamp = node.dataset.timestamp;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

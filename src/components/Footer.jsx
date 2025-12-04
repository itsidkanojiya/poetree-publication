import React from "react";

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white p-8">
      <div className="container mx-auto flex flex-col md:flex-row justify-between">
        <div className="mb-6 md:mb-0">
          <h2 className="text-2xl font-bold mb-4">EDUCAVO</h2>
          <p>© 2020 All Rights Reserved. Developed By RSTheme.</p>
          <div className="flex mt-4">
            <a href="#" className="text-white mr-2">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-white mr-2">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-white mr-2">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-white">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>

        <div className="mb-6 md:mb-0">
          <h3 className="text-md font-semibold mb-4">Explore</h3>
          <ul className="list-none">
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                eLearning School
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Privacy Policy
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Courses
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Become A Teacher
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Blog
              </a>
            </li>
          </ul>
        </div>

        <div className="mb-6 md:mb-0">
          <h3 className="text-md font-semibold mb-4">Categories</h3>
          <ul className="list-none">
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                All Courses
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Web Development
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                General Education
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Digital Marketing
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Web Design
              </a>
            </li>
          </ul>
        </div>

        <div className="mb-6 md:mb-0">
          <h3 className="text-md font-semibold mb-4">Resources</h3>
          <ul className="list-none">
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Become A Teacher
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Instructor/Student Profile
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Courses
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Checkout
              </a>
            </li>
            <li className="mb-2 text-sm">
              <a href="#" className="text-white hover:text-secondary">
                Terms & Conditions
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-4">Address</h3>
          <p className="mb-2 text-sm">503 Old Buffalo Street Northwest</p>
          <p className="mb-2 text-sm">#205 New York-3087</p>
          <p className="mb-2 text-sm">(123)-456-7890, (123)-456-7890</p>
          <p className="mb-2 text-sm">infoname@gmail.com</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

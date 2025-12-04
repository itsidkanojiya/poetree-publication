import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: "/public/s1.jpg",
      title1: "Explore the Beauty",
      title2: "Discover Nature",
    },
    {
      image: "/public/s2.jpg",
      title1: "Experience the Serenity",
      title2: "Find Your Peace",
    },
  ];
  const blocks = [
    {
      color: "bg-blue-500",
      icon: "🏫",
      title: "University Life",
      imgUrl: "/public/b1.jpg",
    },
    {
      color: "bg-sky-500",
      icon: "🎓",
      title: "Graduation",
      imgUrl: "/public/b1.jpg",
    },
    {
      color: "bg-purple-500",
      icon: "🏅",
      title: "Athletics",
      imgUrl: "/public/b1.jpg",
    },
    {
      color: "bg-teal-500",
      icon: "🏠",
      title: "Social",
      imgUrl: "/public/b1.jpg",
    },
  ];

  // Automatically change slides in every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <>
      <Navbar />

      {/* slider */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* Slides */}
        <div
          className="flex transition-transform duration-700"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="min-w-full h-screen bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="bg-black bg-opacity-50 w-full h-full flex flex-col justify-center items-start px-6 md:px-12">
                <h1 className="text-3xl md:text-4xl lg:text-7xl font-thin text-white">
                  {slide.title1}
                </h1>
                <h2 className="text-4xl md:text-5xl lg:text-8xl font-semibold text-secondary mt-4">
                  {slide.title2}
                </h2>
                <button className="mt-8 px-6 py-3 bg-secondary text-white text-lg font-semibold rounded-md hover:bg-primary">
                  Discover More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 rounded-full ${
                currentSlide === index ? "bg-secondary" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* blocks */}
      <div className="w-full flex flex-wrap justify-center items-center p-4">
        {blocks.map((block, index) => (
          <div
            key={index}
            className={`${block.color} relative w-full sm:w-[45%] md:w-[25%] h-60 overflow-hidden shadow-lg`}
          >
            <img
              src={block.imgUrl}
              alt={block.title}
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute inset-0 ${block.color} bg-opacity-80 flex flex-col items-center justify-center`}
            >
              {/* Replace below emoji with a proper icon */}
              <div className="text-white text-6xl mb-4">{block.icon}</div>
              <h3 className="text-white text-lg md:text-xl font-bold">
                {block.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* About Intro */}
      <div className="w-full px-4 lg:px-16 py-10 bg-gray-50">
      <div className="flex flex-wrap lg:flex-nowrap gap-6 justify-center">
        {/* Left Section */}
        <div className="w-full lg:w-[35%] bg-[url('/public/about-intro-bg.jpg')] bg-cover bg-center text-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl uppercase tracking-wide mb-2">About Educavo</h4>
          <h2 className="text-4xl font-bold mb-4">Welcome to Educavo University</h2>
          <p className="text-xl mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua enim ad minim.
          </p>
          <button className="px-6 py-2 bg-secondary hover:bg-primary text-white rounded-lg font-semibold">
            Read More
          </button>
        </div>

        {/* Right Section */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-yellow-100 text-center p-6 rounded-lg shadow-md">
              <h3 className="text-3xl font-bold text-gray-700">2k+</h3>
              <p className="text-lg text-gray-500 mt-2">Students</p>
            </div>
            <div className="bg-green-100 text-center p-6 rounded-lg shadow-md">
              <h3 className="text-3xl font-bold text-gray-700">3.50</h3>
              <p className="text-lg text-gray-500 mt-2">Average CGPA</p>
            </div>
            <div className="bg-blue-100 text-center p-6 rounded-lg shadow-md">
              <h3 className="text-3xl font-bold text-gray-700">95%</h3>
              <p className="text-lg text-gray-500 mt-2">Graduates</p>
            </div>
          </div>

          {/* Images Section */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-md">
              <img
                src="/public/grid1.jpg"
                alt="Graduation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-md">
              <img
                src="/public/grid2.jpg"
                alt="Diplomas"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default Home;

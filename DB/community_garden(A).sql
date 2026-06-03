-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 03, 2026 at 09:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `community_garden`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `pickup_slot_id` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','shipped','cancelled') DEFAULT 'confirmed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `buyer_id`, `pickup_slot_id`, `total_price`, `status`, `created_at`) VALUES
(1, 1, 1, 165.00, 'cancelled', '2026-05-15 14:01:39'),
(2, 1, 1, 55.00, 'confirmed', '2026-06-03 16:20:00'),
(3, 1, 1, 200.00, 'confirmed', '2026-06-03 16:20:32'),
(4, 1, 1, 55.00, 'confirmed', '2026-06-03 16:28:35'),
(5, 1, 1, 55.00, 'shipped', '2026-06-03 17:20:20');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `size` enum('S','M','L','XL') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `size`) VALUES
(1, 1, 1, 3, 55.00, 'M'),
(2, 2, 1, 1, 55.00, 'M'),
(3, 3, 2, 1, 200.00, 'S'),
(4, 4, 1, 1, 55.00, 'M'),
(5, 5, 1, 1, 55.00, 'M');

-- --------------------------------------------------------

--
-- Table structure for table `pickup_slots`
--

CREATE TABLE `pickup_slots` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `slot_start` datetime NOT NULL,
  `slot_end` datetime NOT NULL,
  `max_orders` int(11) DEFAULT 10,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pickup_slots`
--

INSERT INTO `pickup_slots` (`id`, `admin_id`, `slot_start`, `slot_end`, `max_orders`, `created_at`) VALUES
(1, 4, '2027-06-01 09:00:00', '2027-06-01 12:00:00', 10, '2026-05-15 14:00:43');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) DEFAULT 0,
  `size` enum('S','M','L','XL') NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `best_before` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `seller_id`, `name`, `description`, `price`, `quantity`, `size`, `category`, `best_before`, `created_at`, `image_url`) VALUES
(1, 3, 'Fresh Tomato', NULL, 55.00, 94, 'M', 'Vegetable', '2027-12-31', '2026-05-15 13:55:21', NULL),
(2, 3, 'Rare Herb', NULL, 200.00, 1, 'S', 'Herb', '2027-12-31', '2026-05-15 14:02:11', NULL),
(3, 3, 'Premium Salmon 1kg', 'Just a premium salmon', 2890.00, 1, 'L', 'Honey', '2026-06-01', '2026-05-31 22:25:20', '/uploads/1780268467394-Salmon-Fillet-800g-1.1kg2-Custom-1.jpg'),
(44, 2, 'Organic Kale', 'Fresh organic kale leaves, perfect for salads and smoothies.', 4.50, 50, 'L', 'Vegetable', '2027-01-10', '2026-06-03 19:27:44', NULL),
(45, 2, 'Red Tomatoes', 'Vine-ripened red tomatoes, juicy and flavorful.', 3.20, 100, 'M', 'Vegetable', '2027-01-05', '2026-06-03 19:27:44', NULL),
(46, 2, 'Baby Spinach', 'Tender baby spinach leaves, pre-washed and ready to eat.', 5.00, 30, 'S', 'Vegetable', '2027-01-08', '2026-06-03 19:27:44', NULL),
(47, 2, 'Crunchy Carrots', 'Sweet and crunchy organic carrots from local farms.', 2.50, 80, 'M', 'Vegetable', '2027-02-15', '2026-06-03 19:27:44', NULL),
(48, 2, 'Green Broccoli', 'Fresh heads of broccoli, rich in vitamins.', 3.80, 40, 'M', 'Vegetable', '2027-01-12', '2026-06-03 19:27:44', NULL),
(49, 2, 'Red Bell Pepper', 'Sweet and crisp red bell peppers.', 2.00, 60, 'M', 'Vegetable', '2027-01-20', '2026-06-03 19:27:44', NULL),
(50, 2, 'Yellow Onions', 'Versatile yellow onions for all your cooking needs.', 1.50, 150, 'L', 'Vegetable', '2027-03-01', '2026-06-03 19:27:44', NULL),
(51, 2, 'Garlic Bulbs', 'Premium quality garlic bulbs with strong aroma.', 1.00, 200, 'S', 'Herb', '2027-04-10', '2026-06-03 19:27:44', NULL),
(52, 2, 'Fresh Ginger', 'Spicy and aromatic fresh ginger root.', 3.00, 45, 'M', 'Herb', '2027-03-15', '2026-06-03 19:27:44', NULL),
(53, 2, 'Sweet Corn', 'Freshly harvested sweet corn on the cob.', 1.20, 75, 'L', 'Vegetable', '2027-01-15', '2026-06-03 19:27:44', NULL),
(54, 2, 'Japanese Cucumber', 'Crisp and refreshing Japanese cucumbers.', 2.80, 55, 'M', 'Vegetable', '2027-01-07', '2026-06-03 19:27:44', NULL),
(55, 2, 'Russet Potatoes', 'Perfect for baking or making fluffy mashed potatoes.', 0.90, 300, 'L', 'Vegetable', '2027-04-20', '2026-06-03 19:27:44', NULL),
(56, 2, 'Fresh Basil', 'Fragrant Italian basil leaves for pesto or garnish.', 2.20, 25, 'S', 'Herb', '2027-01-05', '2026-06-03 19:27:44', NULL),
(57, 2, 'Red Chili Peppers', 'Hot and spicy fresh red chilies.', 1.50, 90, 'S', 'Herb', '2027-01-30', '2026-06-03 19:27:44', NULL),
(58, 2, 'Coriander Bunch', 'Fresh coriander (cilantro) with roots.', 1.20, 40, 'S', 'Herb', '2027-01-04', '2026-06-03 19:27:44', NULL),
(59, 2, 'Cauliflower', 'Large white cauliflower heads.', 4.00, 20, 'XL', 'Vegetable', '2027-01-14', '2026-06-03 19:27:44', NULL),
(60, 2, 'Zucchini', 'Fresh green zucchini, great for grilling.', 2.60, 50, 'M', 'Vegetable', '2027-01-11', '2026-06-03 19:27:44', NULL),
(61, 2, 'Spring Onions', 'Fresh green onions for garnishing.', 1.00, 60, 'S', 'Herb', '2027-01-06', '2026-06-03 19:27:44', NULL),
(62, 2, 'Lemon', 'Juicy yellow lemons, high in vitamin C.', 0.80, 120, 'S', 'Fruit', '2027-02-10', '2026-06-03 19:27:44', NULL),
(63, 2, 'Pumpkin', 'Sweet and nutty pumpkin, perfect for soups.', 7.50, 15, 'XL', 'Vegetable', '2027-05-01', '2026-06-03 19:27:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('buyer','seller','admin') DEFAULT 'buyer',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `created_at`) VALUES
(1, 'Buyer', 'buyer@test.com', '$2b$12$v/.m3HQffkKC.lqb28krgOwavgYusuFbRdVFjMiS10z0KovKlmHWC', 'buyer', 1, '2026-05-15 13:51:48'),
(2, 'Buyer2', 'buyer2@test.com', '$2b$12$F.6oTiObYbQwS5T6CCUPKO0qKoPHM3gYKLzYIANU6Rx9VXW0SFlhC', 'buyer', 1, '2026-05-15 13:51:49'),
(3, 'Seller', 'seller@test.com', '$2b$10$vcPde1HzxHcNoyegANzba.G5Tvdk7p5yP97nl2W57AqQlFFP7eoFu', 'seller', 1, '2026-05-15 13:51:49'),
(4, 'Admin', 'admin@test.com', '$2b$12$v3ux7HesYmv0gQZMAkNy0eb0u8uupztq4mO0VLXSiDS/ehRkj0Y0q', 'admin', 1, '2026-05-15 13:51:49'),
(5, 'Test Buyer', 'test@test.com', '$2b$10$lW7xFxJ9e9qoRHlOqnf19Oz5TM7MqwZy4nsS6OblYv6c/vnj8PU2C', 'buyer', 1, '2026-05-31 22:16:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `buyer_id` (`buyer_id`),
  ADD KEY `pickup_slot_id` (`pickup_slot_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `pickup_slots`
--
ALTER TABLE `pickup_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `seller_id` (`seller_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `pickup_slots`
--
ALTER TABLE `pickup_slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`pickup_slot_id`) REFERENCES `pickup_slots` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pickup_slots`
--
ALTER TABLE `pickup_slots`
  ADD CONSTRAINT `pickup_slots_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

import React, { useEffect, useState } from "react";
import "./Wishlist.css";
function Wishlist() {

  const [wishlist, setWishlist] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

 useEffect(() => {

  const fetchWishlist = async () => {

    const user = JSON.parse(localStorage.getItem("user"));

    const [wishlistRes, booksRes] = await Promise.all([
      fetch("http://localhost:9999/wishlists"),
      fetch("http://localhost:9999/books")
    ]);

    const wishlistData = await wishlistRes.json();
    const booksData = await booksRes.json();

    const myWishlist = wishlistData
      .filter(item => item.userId === user.id)
      .map(item => {

        const book = booksData.find(b => b.id === item.bookId);

        return {
          ...item,
          title: book?.title,
          image: book?.image,
          author: book?.author
        };

      });

    setWishlist(myWishlist);
  };

  fetchWishlist();

}, []);

  const removeWishlist = (id) => {
    fetch(`http://localhost:9999/wishlists/${id}`, {
      method: "DELETE"
    }).then(() => {
      setWishlist(wishlist.filter(item => item.id !== id));
    });
  };

  return (
    <div className="wishlist-container">

      <h2 className="title">❤️ My Wishlist</h2>

      {wishlist.length === 0 ? (
        <p className="empty">No favorite books yet</p>
      ) : (

        <div className="wishlist-grid">

          {wishlist.map(item => (
            <div className="wishlist-card" key={item.id}>

              <img
                src={item.image}
                alt="book"
                className="book-img"
              />

              <h3>{item.title}</h3>

              <button
                className="remove-btn"
                onClick={() => removeWishlist(item.id)}
              >
                Remove
              </button>

            </div>
          ))}

        </div>

      )}

    </div>
  );
}

export default Wishlist;
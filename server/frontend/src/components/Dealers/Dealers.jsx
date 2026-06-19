import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import review_icon from "../assets/reviewicon.png";

const Dealers = () => {

  const [dealersList, setDealersList] = useState([]);
  const [states, setStates] = useState([]);

  const dealer_url = "/djangoapp/get_dealers";

  const filterDealers = async (state) => {
    const url =
      state === "All"
        ? "/djangoapp/get_dealers"
        : `/djangoapp/get_dealers/${state}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 200) {
      setDealersList(Array.isArray(data.dealers) ? data.dealers : []);
    }
  };

  const get_dealers = async () => {
    const res = await fetch(dealer_url);
    const data = await res.json();

    if (data.status === 200) {
      const all_dealers = Array.isArray(data.dealers) ? data.dealers : [];

      setDealersList(all_dealers);

      const uniqueStates = [
        ...new Set(all_dealers.map(d => d.state))
      ];

      setStates(uniqueStates);
    }
  };

  useEffect(() => {
    get_dealers();
  }, []);

  const isLoggedIn = sessionStorage.getItem("username") != null;

  return (
    <div>
      <Header />

      <table className='table'>
        <thead>
          <tr>
            <th>ID</th>
            <th>Dealer Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Zip</th>
            <th>
              <select onChange={(e) => filterDealers(e.target.value)}>
                <option value="">State</option>
                <option value="All">All States</option>
                {states.map((state, index) => (
                  <option key={index} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </th>

            {isLoggedIn && <th>Review Dealer</th>}
          </tr>
        </thead>

        <tbody>
          {dealersList.map((dealer) => (
            <tr key={dealer.id}>
              <td>{dealer.id}</td>
              <td>
                <Link to={`/dealer/${dealer.id}`}>
                  {dealer.full_name}
                </Link>
              </td>
              <td>{dealer.city}</td>
              <td>{dealer.address}</td>
              <td>{dealer.zip}</td>
              <td>{dealer.state}</td>

              {isLoggedIn && (
                <td>
                  <Link to={`/postreview/${dealer.id}`}>
                    <img
                      src={review_icon}
                      className="review_icon"
                      alt="Post Review"
                    />
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dealers;

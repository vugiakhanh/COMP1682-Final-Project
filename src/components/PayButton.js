import React from "react";
import StripeCheckOut from 'react-stripe-checkout';
import { API, graphqlOperation } from 'aws-amplify';
import { createOrder } from "../graphql/mutations";
import { getUser } from "../graphql/queries";
import { Notification, Message } from "element-react";
import { history } from "../App";

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: "pk_test_51Ifp2FDKNglRTbqkWyN7htnS8uj0W1TvOplZyj58J1aRxCO2Fi5ET9QAhE4O1wXpoO62HiywcfBgDMhQ1eZx9uJD00aWSdLKty"
}


const PayButton = ({product, user }) => {
  const getOwnerEmail = async ownerId => {
    console.log(ownerId)
    try {
      const input = { id: ownerId };
      const result = await API.graphql(graphqlOperation(getUser, input));
      return result.data.getUser.email;
    } catch (err) {
      console.error(`Error fetching product owner's email`, err);
    }
  };

  const createShippingAddress = source => ({
    city: source.address_city,
    country: source.address_country,
    address_line1: source.address_line1,
    address_state: "1",
    address_zip: source.address_zip
  });


  const handleCharge = async token => {
    try {
      const ownerEmail = await getOwnerEmail(product.owner);
      console.log({ ownerEmail });
      const result = await API.post('orderlam', '/charge', {
        body: {
          token,
          charge : {
            currency: stripeConfig.currency,
            amount: product.price,
            description: product.description
          },
          email: {
            customerEmail: user.attributes.email,
            ownerEmail,
            shipped: product.shipped
          }
        }
      })
      console.log(result);
      if (result.charge.status === "succeeded") {
        let shippingAddress = null;
        if (product.shipped) {
          shippingAddress = createShippingAddress(result.charge.source);
        }
        const input = {
          orderUserId: user.attributes.sub,
          orderProductId: product.id,
          shippingAddress
        };
        console.log(input)
        const order = await API.graphql(
          graphqlOperation(createOrder, { input })
        );
        console.log({ order });
        Notification({
          title: "Success",
          message: `${result.message}`,
          type: "success",
          duration: 3000
        });
        setTimeout(() => {
          history.push("/");
          Message({
            type: "info",
            message: "Check your verified email for order details",
            duration: 2000,
            showClose: true
          });
        }, 3000);
      }
    }catch(err) {
      console.error(err)
    }
  }

  return (
    <StripeCheckOut 
    token={handleCharge}
      email={user.attributes.email}
      name={product.description}
      amount={product.price}
      currency={stripeConfig.currency}
      stripeKey={stripeConfig.publishableAPIKey}
      shippingAddress={product.shipped}
      billingAddress={product.shipped}
      locale="auto"
      allowRememberMe={false}
    />
  )
}

export default PayButton;
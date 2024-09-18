import { response } from "express";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModle.js";  // Corrected filename
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:5174";  // Dynamic frontend URL

  try {
    // Create a new order in the database
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });
    await newOrder.save();

    // Clear the user's cart
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Create line items for Stripe
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,  // Amount in cents
      },
      quantity: item.quantity,
    }));

    // Add delivery charge as a line item
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 2000 * 100,  // Delivery charge in cents
      },
      quantity: 1,
    });

    // Create a Stripe session
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    // Send session URL to frontend
    res.json({ success: true, session_url: session.url });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Error placing order. Please try again later." });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      const payment = { status: "Paid" };
      await orderModel.findByIdAndUpdate(orderId, { payment });
      res.json({ success: true, message: "Payment successful" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment failed, order deleted" });
    }
  } catch (error) {
    console.log("Error verifying order:", error);
    res.status(500).json({ success: false, message: "Error verifying order" });
  }
};

//user orders for frontend 

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({userId:req.body.userId});
    res.json({success:true,data:orders})
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Error"})
  }

} 

// listing orders for admin panel 
const listOrders = async (req,res) => {
  try {
    const orders = await orderModel.find({});
    res.json({success:true,data:orders})
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Error"})
  }
}

// api for updating order status 

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
    res.json({success:true,message:"Order status updated"})
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Error"})
  }
}


export { placeOrder, verifyOrder,userOrders,listOrders,updateStatus };



























// import orderModel from "../models/orderModel.js";
// import userModel from "../models/userModle.js";
// import Stripe from "stripe"


// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// //placing user order for frontend
// const placeOrder = async (req,res) => {

//     const frontend_url = " http://localhost:5173";

//     try {
//         const newOrder = new orderModel({
//             userId:req.body.userId,
//             items:req.body.items,
//             amount:req.body.amount,
//             address:req.body.address
//         })
//         await newOrder.save();
//         await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}})

//         const line_items = req.body.items.map((item)=>({
//             price_data:{
//                 currency:"usd",
//                 product_data:{
//                     name:item.name
//                 },
//                 unit_amount:item.price*100
//             },

//             quantity:item.quantity
//         }))

//         line_items.push({
//             price_data:{
//                 currency:"usd",
//                 product_data:{
//                     name:"Delivery Charges"
//                 },
//                 unit_amount:2*100
//             },
//             quantity:1
//         })

//         const session = await stripe.checkout.sessions.create({
//             line_items:line_items,
//             mode:'payment',
//             success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
//             cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`,


//         })

//         res.json({success:true,session_url:session.url})


//     } catch (error) {
//         console.log(error);
//         res.json({success:false,message:"Error"})
        
//     } 
// } 

// export {placeOrder};
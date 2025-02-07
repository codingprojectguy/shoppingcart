
//MCV pattern:

// API sections 
const API = (() => {
  const URL = "http://localhost:3000";

  const cartURL = "http://localhost:3000/cart";
  const inventoryURL = "http://localhost:3000/inventory";
  const getCart = () => {
    // define your method to get cart data
    return fetch(cartURL).then((res)=> res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(inventoryURL).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(cartURL,{
      method:"POST",
      headers:{
        "Content-Type": "application/json",
      },
      body:JSON.stringify(inventoryItem),
    }).then((res)=> res.json());
  };

  const updateInventory = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${inventoryURL}/${id}`,{
      method:"PATCH",
      headers:{
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: newAmount }), 
    }).then((res)=> res.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${cartURL}/${id}`,{
      method:"PATCH",
      headers:{
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: newAmount }), 
    }).then((res)=> res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${cartURL}/${id}`,{
      method:"DELETE",
      headers:{
        "Content-Type": "application/json",
      }
    }).then((res)=> res.json())
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id))) 
    );
  };

  return {
    getCart,
    updateInventory,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

//Model manage update the db.json data file.
const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    updateInventory,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    updateInventory,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

//View Render export to the html. Can be View by the users. 
const View = (() => {
  // implement your logic for View

  const inventoryListEl = document.querySelector(".inventory-list");
  const cartListEl = document.querySelector(".cart-list");
  const checkoutBtnEl = document.querySelector(".checkout-btn")

  const renderInventory = (items) => {
    let inventoryTemplate = "";
    items.forEach((item) => {
      const inventoryItem = `
        <li data-id="${item.id}">
          <img src="${item.image}" alt="${item.content}" class="inventory-img"/>
          <span class="white-content">${item.content}</span> 
                    <div class="counter">
            <button class="decrease-btn">-</button>
            <span class="count white-content">${item.amount}</span>
            <button class="increase-btn">+</button>
          </div>
        <button class="add-cart-btn" data-id="${item.id}" data-item="${item.content}" data-amount=${item.amount}>Add to Cart</button>
        </li>`;
      inventoryTemplate += inventoryItem;
    });
    inventoryListEl.innerHTML = inventoryTemplate;
  };

  const renderCart = (items) => {
    let cartTemplate = "";
    items.forEach((item) => {
      const cartItem = `
        <li data-id="${item.id}">
          <span>${item.content}</span>
          <div class="counter">
            <button class="decrease-btn">-</button>
            <span class="count">${item.amount}</span>
            <button class="increase-btn">+</button>
          </div>
          <button class="cart_delete_btn">Delete</button>
        </li>`;
      cartTemplate += cartItem;
    });
    cartListEl.innerHTML = cartTemplate;
  };

    return {
      renderInventory,
      renderCart,
      inventoryListEl,
      cartListEl,
      checkoutBtnEl
    };
})();

//Controller manage handle functions events between model and view.
const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleAddToCart = () => {
    view.inventoryListEl.addEventListener("click",(event)=>{
    if (event.target.classList.contains("add-cart-btn")) {
      const itemName = event.target.dataset.item;
      const itemAmount = event.target.dataset.amount;
      const itemId = event.target.dataset.id;
      const num = Number(itemAmount);
      const id = Number(itemId);
  
      if (itemName && num > 0) {
        model.addToCart({ id: id, content: itemName, amount: num })
          .then(() => model.updateInventory(id, 0)) 
          .then(() => model.getCart())
          .then((data) => { state.cart = data; });
      }
    }
  })
  };

  const handleInventoryActions = () => {
    view.inventoryListEl.addEventListener("click", (event)=>{;
    const li = event.target.closest("li");
    if (!li) return;
    const id = li.dataset.id;
    const item = state.inventory.find((item) => item.id == id);
  
    if (event.target.classList.contains("increase-btn") && item) {
      model.updateInventory(id, item.amount + 1)
        .then(() => model.getInventory())
        .then((data) => { state.inventory = data; });
    }
  
    if (event.target.classList.contains("decrease-btn") && item && item.amount > 0) {
      model.updateInventory(id, item.amount - 1)
        .then(() => model.getInventory())
        .then((data) => { state.inventory = data; });
    }
  })
  };

  //update Cart combine with delete button
  
  const handleCartActions = () => {
    view.cartListEl.addEventListener("click",(event)=>{
    const li = event.target.closest("li");
    if (!li) return;
    const id = li.dataset.id; 
  
    if (event.target.classList.contains("increase-btn")) {
      const item = state.cart.find((item) => item.id == id);
      if (item) {
        model.updateCart(id, item.amount + 1).then(() => 
          model.getCart().then((data) => { state.cart = data; })
        );
      }
    }
  
    if (event.target.classList.contains("decrease-btn")) {
      const item = state.cart.find((item) => item.id == id);
      if (item && item.amount > 1) {
        model.updateCart(id, item.amount - 1).then(() => 
          model.getCart().then((data) => { state.cart = data; })
        );
      }
    }
  
    if (event.target.classList.contains("cart_delete_btn")) {
      model.deleteFromCart(id).then(() => 
        model.getCart().then((data) => { state.cart = data; })
      );
    }
  });
  };

  const handleCheckout = () => {
    view.checkoutBtnEl.addEventListener("click",()=>{
    model.checkout().then(()=> model.getCart().then((data)=>{state.cart=data}));
  });
  };
  const init = () => {
    model.getInventory().then((data)=> {state.inventory = data});
    model.getCart().then((data) => {state.cart = data});
  };
  
  const bootstrap = () => {
    init();
    state.subscribe(()=>{
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
    handleAddToCart();
    handleInventoryActions();
    handleCartActions();
    handleCheckout();
  };
  return {
    bootstrap
  };
})(Model, View);

Controller.bootstrap();

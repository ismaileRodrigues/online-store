document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    document.getElementById('addProductForm').addEventListener('submit', (event) => {
        event.preventDefault();
        addProduct();
    });
});

let products = [];

function loadProducts() {
    fetch('http://localhost:3000/api/products')
        .then(response => response.json())
        .then(data => {
            products = data;
            renderProducts();
        });
}

function renderProducts() {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    products.forEach((product) => {
        const productElement = document.createElement('div');
        productElement.classList.add('product');
        productElement.innerHTML = `
            <img src="http://localhost:3000${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>Preço: R$ ${product.price.toFixed(2)}</p>
            <button onclick="deleteProduct(${product.id})">Excluir Produto</button>
        `;
        productsContainer.appendChild(productElement);
    });
}

function addProduct() {
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('image', document.getElementById('productImage').files[0]);

    fetch('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(product => {
        products.push(product);
        renderProducts();
        document.getElementById('addProductForm').reset();
    })
    .catch(error => {
        console.error('Erro ao adicionar produto:', error);
    });
}

function deleteProduct(id) {
    fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        products = products.filter(product => product.id !== id);
        renderProducts();
    })
    .catch(error => {
        console.error('Erro ao excluir produto:', error);
    });
}

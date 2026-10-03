# Imagens da Sillage

## Fotos dos produtos (`img/products/<id>.jpg`)
Recortadas do catálogo **"SIllage Catálogo editado.pdf"** (Canva). O número da página de cada produto aparece num comentário em `js/data.js` (`// pág. N`). São JPEG de ~800 px, com menos de 100 KB cada.

As fotos têm fundo cinza-claro. O CSS (`img.photo` com `mix-blend-mode: multiply`) faz esse fundo sumir sobre o "estúdio" claro do card, e a foto aparece inteira (`object-fit: contain`).

## Como trocar ou adicionar
1. Salve a foto em `img/products/<id>.jpg`, de preferência quadrada ou vertical, com o frasco inteiro e fundo branco ou claro liso.
2. Em `js/data.js`, no produto, use `image: "img/products/<id>.jpg"`.
3. Se a foto faltar ou não carregar, aparece um frasco ilustrado no lugar.

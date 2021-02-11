//https://forkify-api.herokuapp.com/api/search
"use strict";
let currIdMax = 1;
/*****************************************


            Search model
            
            
 *******************************************/
class Search{
    constructor(query){
        this.query = query;
    }
    async getResults(){
        try{
      const queryResult = await (await fetch(`https://forkify-api.herokuapp.com/api/search?q=${this.query}`)).json();
      this.result = queryResult.recipes; 
        }catch (ex){
            alert(ex);
        }
    }
}

/*****************************************


            Likes Model
            
            
 *******************************************/
class Likes{
    constructor(){
        this.likes = [];
    }
    addLike(id,title,author,img){
        this.likes.push({id,title,author,img});
        // Ubaci data u localStorage
        this.persistData();
        return {id,title,author,img};
    }
    deleteLike(id){
        this.likes.splice(this.likes.findIndex(el=>el == id),1);
        this.persistData();
    }
    isLiked(id){
      const index = this.likes.findIndex(el=>el.id == id);
        return (index > -1);
    }
    getNumOfLikes(){
        return this.likes.length;
    }

    persistData(){
        localStorage.setItem('likes',JSON.stringify(this.likes));
    }

    readStorage(){
        // likes su array objekata i sve je okej, konvertuje i array objekata
        const storage = JSON.parse(localStorage.getItem('likes'));
        if(storage){
            this.likes = storage;
        }

    }
}

/*****************************************


           searchView.js
            
            
 *******************************************/
let searchView = (function(){
    let elements = {
        searchForm: '.search',
        searchInput: '.search__field',
        searchResList: '.results__list',
        loaderClass: 'loader',
        searchResPages: '.results__pages'
    }; 
   
    const renderRecipe = (recipe, limit=17)=>{
        const markup =`<li>
                    <a class="results__link results__link" href="#${recipe.recipe_id}">
                        <figure class="results__fig">
                            <img src="${recipe.image_url}" alt="${recipe.title}">
                        </figure>
                        <div class="results__data">
                            <h4 class="results__name">${(recipe.title.length > limit) ?  recipe.title.slice(0,limit-3).trim()+'...' : recipe.title }</h4>
                            <p class="results__author">${recipe.publisher}</p>
                        </div>
                    </a>
                </li>`;
                document.querySelector(elements.searchResList).insertAdjacentHTML('beforeend',markup);
    };
    //prev/next
        let createButton = (page, type)=>`
        <button class="btn-inline results__btn--${type}" data-goto="${type == 'prev' ? page - 1 : page + 1}">
        <span>Page ${type == 'prev' ? page - 1 : page + 1}</span>    
        <svg class="search__icon">
                <use href="img/icons.svg#icon-triangle-${type == 'prev' ? 'left' : 'right'}"></use>
            </svg>
        </button>`;

        const renderButtons = function(page, numResults, resPerPage){
            const pages = Math.ceil(numResults/resPerPage);
            let button;
            if(page == 1){
               button = createButton(page,'next');
            }else if((page > 1) && (page < pages)){
                button = createButton(page,'prev') +' '+ createButton(page,'next');

            }
            else if(page == pages){
                button = createButton(page,'prev');
            }
           document.querySelector(elements.searchResPages).insertAdjacentHTML('afterbegin', button);
        };

    return {
        renderResults : (recipesArr, page = 1, resPerPage = 10)=>{
            let min = (page-1) * resPerPage;
            let max = page * resPerPage;
            for(let recipe of recipesArr.slice(min,max)){
                renderRecipe(recipe);
            }
            renderButtons(page,recipesArr.length,resPerPage);

        },
        // Start or Stop
        renderLoader : (parentEl, action)=>{
            if(action =='start'){
            const loader = `<div class='${elements.loaderClass}'> <svg><use href="img/icons.svg#icon-cw"></use></svg></div>`;
            parentEl.insertAdjacentHTML('afterbegin',loader);}
            if(action == 'stop'){
                parentEl.removeChild(document.querySelector(`.${elements.loaderClass}`));
            }
        },
        getElements : elements
    };
})();
/*****************************************


           viewContoller
            
            
 *******************************************/
/*Global state of the app 
    - Search object(podaci o searchu)
    - Current recipe object
    - Shopping list object
    - Liked recipes
    */
const state = {
    search: undefined,
    likes: new Likes()
};
state.likes.readStorage();



//kontroler za search
const ControlSearch = async function(){
     //1.) Dobiti querry od view-a
     const query = document.querySelector(searchView.getElements.searchInput).value; //kasnije iz view uzeti
     if(query){
         //2.) Novi search objekat i dodati u state objekat
         state.search = new Search(query);

         //3.) Pripremiti UI za rezultate
         document.querySelector(searchView.getElements.searchInput).value = ''; //Clear input
         document.querySelector(searchView.getElements.searchResList).innerHTML = ''; //Clear list
         document.querySelector(searchView.getElements.searchResPages).innerHTML = ''; //Clear buttons
         searchView.renderLoader(document.querySelector(searchView.getElements.searchResList),'start');
         
         //renderLoader

         //4.) Pretrazi recepte       
          try{
            await state.search.getResults();
            searchView.renderLoader(document.querySelector(searchView.getElements.searchResList),'stop');
             //5.) Prikazi rezultate na UI, a posto je getResults async funkcija, ovde bi je vec trebali sacekati
             searchView.renderResults(state.search.result);
        }
        catch (err){
            alert("Something went wrong, couldn't find any recipes...");
            document.querySelector(searchView.getElements.searchInput).value = ''; //Clear input
            document.querySelector(searchView.getElements.searchResList).innerHTML = ''; //Clear list
            searchView.renderLoader(document.querySelector(searchView.getElements.searchResList),'stop');
        }
     }
    /*
     U slucaju da bude zahtevalo dalje da se koristi await state.search.getResults();,
     samo stavi da je da funkcija ControlSearch asinhrona
    */
    };
//Search submit form
document.querySelector(searchView.getElements.searchForm).addEventListener('submit',(eventObj)=>{
    eventObj.preventDefault(); //Da se ne reloaduje stranica
    ControlSearch();
});
//Switch pages
document.querySelector(searchView.getElements.searchResPages).addEventListener('click', (eventObj)=>{
   const btn = eventObj.target.closest('.btn-inline');
   if(btn){
       const goToPage = parseInt(btn.dataset.goto);
       document.querySelector(searchView.getElements.searchResList).innerHTML = ''; //Clear list
       document.querySelector(searchView.getElements.searchResPages).innerHTML = ''; //Clear buttons
       searchView.renderResults(state.search.result, goToPage); //Load new results
   } 
});

/*****************************************


            Recipe model
            
            
 *******************************************/
class Recipe{
    constructor(recipeID){
        this.id = recipeID;
    }
    async getRecipe(){
        try{
          const results = await (await fetch(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`)).json();
            this.ingredients = results.recipe.ingredients;
            this.title = results.recipe.title;
            this.author = results.recipe.publisher;
            this.img = results.recipe.image_url;
            this.url = results.recipe.source_url;
        }catch (er){
            console.log(er);

        }
    }
    calcTime(){
        //15 min za svaka 3 sastojka
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng/3);
        this.time = periods * 15;
    }
    calcServings(){
        //Hard coded, da ne racunamo
        this.servings = 4;
    }
    parseIngredients(){
        const unitsLong = ['tablespoons','tablespoon','ounces','ounce','teaspoons','teaspoon','cups','pounds'];
        const unitsShort = ['tbsp','tbsp','oz','oz','tsp','tsp','cup','pound'];
        const units = [...unitsShort,'kg','g'];

        const newIngridients = this.ingredients.map(el=>{
            // Uniform units
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit,index)=>{
                ingredient = ingredient.replace(unit,units[index]);
            });
            // Remove parentheses
            ingredient = ingredient.replace(/ *\([^)]*\) */g,'');

            // Parse ingredients into count, unit and ingredient
            const arrIngredient = ingredient.split(' ');
            const unitIndex = arrIngredient.findIndex((el2)=>unitsShort.includes(el2));
            let objIngredient;
            if(unitIndex > -1){
                const arrCount = arrIngredient.slice(0,unitIndex);
                let countz;
                if(arrCount.length == 1){
                    countz = (Math.floor(eval(arrCount[0].replace('-','+'))*100))/100;
                }
                else{
                    countz = (Math.floor(eval(arrIngredient.slice(0,unitIndex).join('+'))*100))/100;
//arrIng
                }
                objIngredient = {
                    count:(Math.floor(eval(countz)*100))/100,
                    unit:arrIngredient[unitIndex],
                    ingredients:arrIngredient.slice(unitIndex+1).join(' ')
                }
            }else if(parseInt(arrIngredient[0],10)){
                //There is no unit but there is a number as the first element 

                objIngredient = {
                    count:(Math.floor(eval(arrIngredient[0])*100))/100,
                    unit:'',
                    ingredients: arrIngredient.slice(1).join(' ') 
                }
            } else if(unitIndex === -1)
            {
                //No unit and no number at the first position
                objIngredient = {
                    count:1,
                    unit:'',
                    ingredients:arrIngredient.join(' ')
                }
            }
            return objIngredient;
        });
        this.ingredients = newIngridients;
    }

    // dec - inc
    updateServings(type){
        //Servings
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;
        //Ingredients
        this.ingredients.forEach(ing=>{
            ing.count *= (newServings/this.servings);
        });

        this.servings = newServings;
    }
}
/*****************************************


            Recipe View
            
            
 *******************************************/
let recipeView = (function(){
    const elements = {
        recipe:'.recipe'
    }
    const showRecipe = (recipe,isLiked) =>{
        const createIngredient = function(ingredient){
            return `<li class="recipe__item">
            <svg class="recipe__icon">
                <use href="img/icons.svg#icon-check"></use>
            </svg>
            <div class="recipe__count">${ingredient.count}</div>
            <div class="recipe__ingredient">
                <span class="recipe__unit">${ingredient.unit}</span>
                ${ingredient.ingredients}
            </div>
        </li>`;
        }
        const markup = 
        `<figure class="recipe__fig">
                    <img src="${recipe.img}" alt="${recipe.title}" class="recipe__img">
                    <h1 class="recipe__title">
                        <span>${recipe.title}</span>
                    </h1>
                </figure>
                <div class="recipe__details">
                    <div class="recipe__info">
                        <svg class="recipe__info-icon">
                            <use href="img/icons.svg#icon-stopwatch"></use>
                        </svg>
                        <span class="recipe__info-data recipe__info-data--minutes">${recipe.time}</span>
                        <span class="recipe__info-text"> minutes</span>
                    </div>
                    <div class="recipe__info">
                        <svg class="recipe__info-icon">
                            <use href="img/icons.svg#icon-man"></use>
                        </svg>
                        <span class="recipe__info-data recipe__info-data--people">${recipe.servings}</span>
                        <span class="recipe__info-text"> servings</span>
    
                        <div class="recipe__info-buttons">
                            <button class="btn-tiny btn-decrease">
                                <svg>
                                    <use href="img/icons.svg#icon-circle-with-minus"></use>
                                </svg>
                            </button>
                            <button class="btn-tiny btn-increase">
                                <svg>
                                    <use href="img/icons.svg#icon-circle-with-plus"></use>
                                </svg>
                            </button>
                        </div>
    
                    </div>
                    <button class="recipe__love">
                        <svg class="header__likes">
                            <use href="img/icons.svg#icon-heart${isLiked ? '' : '-outlined'}"></use>
                        </svg>
                    </button>
                </div>
    
                <div class="recipe__ingredients">
                    <ul class="recipe__ingredient-list">
                    ${recipe.ingredients.map(el=>createIngredient(el)).join(' ')}
                    </ul>
    
                    <button class="btn-small recipe__btn recipe__btn--add">
                        <svg class="search__icon">
                            <use href="img/icons.svg#icon-shopping-cart"></use>
                        </svg>
                        <span>Add to shopping list</span>
                    </button>
                </div>
    
                <div class="recipe__directions">
                    <h2 class="heading-2">How to cook it</h2>
                    <p class="recipe__directions-text">
                        This recipe was carefully designed and tested by
                        <span class="recipe__by">${recipe.author}</span>. Please check out directions at their website.
                    </p>
                    <a class="btn-small recipe__btn" href="${recipe.url}" target="_blank">
                        <span>Directions</span>
                        <svg class="search__icon">
                            <use href="img/icons.svg#icon-triangle-right"></use>
                        </svg>
    
                    </a>
                </div>`;
                document.querySelector(elements.recipe).insertAdjacentHTML('afterbegin',markup);
    }

    const updateServingsIngredients = recipe =>{
        //Update servings
        document.querySelector('.recipe__info-data--people').textContent = recipe.servings;
        //Update ingredients
        let countElements = Array.from(document.querySelectorAll('.recipe__count'));
        countElements.forEach((el,ind)=>{
            el.textContent = recipe.ingredients[ind].count;
        });
    }
    return {
        updateServingsIngredients,
        showRecipe,
        getElements:elements
    }
})()


/*****************************************


            Recipe controller
            
            
 *******************************************/
const controlRecipe = async function(){
    //GET ID from url

    const id = window.location.hash.replace('#',' ');
    if(id){
        //Prepare UI for changes
        
        //Create new recipe object
        state.recipe = new Recipe(id);
        try{
            document.querySelector(recipeView.getElements.recipe).innerHTML='';
            searchView.renderLoader(document.querySelector(recipeView.getElements.recipe),'start');
        //Get recipe data
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        //Calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();
        //Render the recipe
        searchView.renderLoader(document.querySelector(recipeView.getElements.recipe),'stop');
        recipeView.showRecipe(state.recipe,state.likes.isLiked(id));

        }catch(er){
            console.log(er);
            alert("Error processing the recipe");
        }
        
    }
}
for(let event of ['load','hashchange']){
    window.addEventListener(event,controlRecipe);
}
//Restore likes on page load

window.addEventListener('load',()=>{
    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());
    state.likes.likes.forEach(like=>likesView.renderLike(like));
})

//Recipe button clicks
document.querySelector(recipeView.getElements.recipe).addEventListener('click',e=>{
    if(e.target.matches('.btn-decrease, .btn-decrease *')){  //.btn-decrease * -> .btn decrease i sve njegove childrene
        //Decrease button se pritisao
        if(state.recipe.servings>1){
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
        }
    }
    if(e.target.matches('.btn-increase, .btn-increase *')){
        //Increase button se pritisao
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }
    if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){ //Recipe list controller
        //Add a recipe to the shopping list
       controlList();
    }
    if(e.target.matches('.recipe__love, .recipe__love *')){ //Like Controller
        //Call like controller
        controlLike();
    }
});
/*****************************************


            ShoppingList Model
            
            
 *******************************************/
    class List{
        constructor(){
            this.items = [];
           
        }

        addItem(count,unit,ingredient){
            const item ={
                count,
                unit,
                ingredient,
                id : currIdMax
            }
            currIdMax += 1;
            this.items.push(item);
        }

        deleteItem(id){
            this.items.splice(this.items.findIndex(el=>el.id == id),1);
        }

        updateCount(id,newCount){
           this.items.find(el=>el.id == id).count = newCount;

        }   
    }
 /*****************************************


            ShoppingList View
            
            
 *******************************************/
let listView = (function () {
    const elements = {
        shoppingList:'.shopping__list'
    };
    const renderItem = (item) => {
        const markup =
            `<li class="shopping__item" data-itemid=${item.id}>
        <div class="shopping__count">
            <input type="number" value="${item.count}" step="${item.count} class="shopping__count-value">
            <p>${item.unit}</p>
        </div>
        <p class="shopping__description">${item.ingredient}</p>
        <button class="shopping__delete btn-tiny">
            <svg>
                <use href="img/icons.svg#icon-circle-with-cross"></use>
            </svg>
        </button>
    </li>`;
        document.querySelector(elements.shoppingList).insertAdjacentHTML('beforeend',markup);
    };
    const deleteItem = (id) => {
        document.querySelector(elements.shoppingList).removeChild(document.querySelector(`[data-itemid="${id}"]`));
    };
    return {
        getElements:elements,
        renderItem,
        deleteItem
    }
})();
 /*****************************************


            ShoppingList Controller
            
            
 *******************************************/

function controlList(){
  
    if(state.list){
        

    }else{
          //Nova lista ako nema ni jedne
        state.list = new List();
        state.recipe.ingredients.forEach(el=>{
            state.list.addItem(el.count, el.unit, el.ingredients);
        });
        state.list.items.forEach(el=>{
            listView.renderItem(el);
        });
    }
}
//Handle delete and update list item events
document.querySelector(listView.getElements.shoppingList).addEventListener('click',ev=>{
   const id = ev.target.closest('.shopping__item').dataset.itemid;
  
   //Handle the delete button
 
   if(ev.target.matches('.shopping__delete, .shopping__delete *')){
    //Delete from state
    state.list.deleteItem(id);
    //Delete from ui
    listView.deleteItem(id);
   }
  else if(ev.target.matches('input[type="number"]')){
    state.list.updateCount(id,parseFloat(ev.target.value,10));
  }
 
});

/*****************************************


            Likes View
            
            
 *******************************************/
const likesView = (function(){
    const elements = {
        heartButton: '.recipe__love',
        likesMenu: '.likes__field',
        likesList:'.likes__list'
    }
    const isLiked = function(isLiked){
        const iconString = `img/icons.svg#${isLiked ? 'icon-heart-outlined':'icon-heart'}`;
        document.querySelector(elements.heartButton + ' use').setAttribute('href', iconString);
    }
    function toggleLikeMenu(numLikes){
        document.querySelector(elements.likesMenu).style.visibility = numLikes > 0 ? 'visible':'hidden';
    } 
    function renderLike(like){
        const markup =`<li>
        <a class="likes__link" href="#${like.id}">
            <figure class="likes__fig">
                <img src="${like.img}" alt="${like.title}">
            </figure>
            <div class="likes__data">
                <h4 class="likes__name">${like.title}</h4>
                <p class="likes__author">${like.author}</p>
            </div>
        </a>
    </li>`;
    document.querySelector(elements.likesList).insertAdjacentHTML('beforeend',markup);
    }
    function deleteLike(id){
         document.querySelector(elements.likesList).removeChild(document.querySelector(`.likes__link[href="#${id}"]`).parentNode);
    
    }
    return {
        isLiked,
        toggleLikeMenu,
        renderLike,
        deleteLike
    }
})()
/*****************************************


            Likes Controller
            
            
 *******************************************/
//U recipe se dogadja
function controlLike(){
    if(!state.likes){
        state.likes = new Likes();
    }

    if(state.likes.isLiked(state.recipe.id)==true){ //If it's liked
    //Remove like to the state
    state.likes.deleteLike(state.recipe.id);
     //Toggle the button
     likesView.isLiked(true);
     //Remove Like to the UI
     likesView.deleteLike(state.recipe.id);
   }else
    { //If it's not liked
    //Add like to the state
    const newLike = state.likes.addLike(state.recipe.id, state.recipe.title, state.recipe.author,state.recipe.img);
    //Toggle the button
   likesView.isLiked(false);
    //Add Like to the UI
    likesView.renderLike(newLike);
 } 
 likesView.toggleLikeMenu(state.likes.getNumOfLikes());
}
/**
 * Wrap into IIFE to simulate a module
 */
(() => {
/**
 * Constants
 */
const BASE_URL = 'http://api.tvmaze.com/';
const buttonSelector = '.search-btn';
const inputSelector = '.search-input';
const paginationSelector = '.pagination';
const clickEventName = 'click';
const classAttributeName = 'class';
const movieListClassName = 'movie-list';
const castItemClassName = 'cast-list__item';
const pageSize = 5;
/**
 * Application state
 */
let movieContainer = []; 
let visibleMovieContainer = [];
let page = 0;

/**
 * Application logic 
 */

navigator.serviceWorker.register('serviceworker.js').then(() => console.log('registered'));

const paginationBlock = document.querySelector(paginationSelector);

const buildSearchURL = (query) => `search/shows?q=${query}`;

const makeRequest = (query) => {
    return fetch(`${BASE_URL}${buildSearchURL(query)}`)
    .then(response => response.json())
    .then(jsonResult => {
        movieContainer = jsonResult.map(item => ({ id: item.show.id, title: item.show.name, cast:[] }));
        const moviesRequests = jsonResult.map(item => fetch(`${item.show._links.self.href}?embed=cast`));
        return Promise.all(moviesRequests);
    })
    .then(moviesDetails => {
        const toJSONPromises =  moviesDetails.map(item => item.json());
        return Promise.all(toJSONPromises);
    })
    .then(jsonMovieDetails => {
        movieContainer = movieContainer.map(item => {
            const info = jsonMovieDetails.find(detailsItem => detailsItem.id === item.id);
            return {...item, cast: info._embedded.cast.sort((o1, o2) => {
                if(o1.person.birthday === null) return 1;// Lift off all persons with null birthday field
                return o1.person.birthday > o2.person.birthday ? 1: -1;
            })}
        })
    })
    .catch(err => console.error(err));
};

const paginate = () => {
    visibleMovieContainer = movieContainer.slice(page * pageSize, pageSize * (page + 1));
}

const updatePagination = () => {
    paginationBlock.children[0].disabled = page === 0;
    paginationBlock.children[1].textContent = `Page ${page + 1}`;
    paginationBlock.children[2].disabled = (page + 1) * pageSize  >= movieContainer.length;
}

const buttonHandler = (event) => {
    const { value } = document.querySelector(inputSelector);
    if(value !== '') {
        makeRequest(value)
        .then(() => update());
    }
}

const update = () => {
    paginate();
    showMovies();
    updatePagination();
}

const prevButtonHandler = () => {
    page -= 1;
    update();
}

const nextButtonHandler = () => {
    page += 1;
    update();
}
/**
 * Work with DOM
 */
document.querySelector(buttonSelector).addEventListener(clickEventName, buttonHandler);
paginationBlock.children[0].addEventListener(clickEventName, prevButtonHandler);
paginationBlock.children[2].addEventListener(clickEventName, nextButtonHandler);

const showMovies = () => {
    const fragment = document.createDocumentFragment();
    const listElement = document.createElement('ul');
    listElement.setAttribute(classAttributeName, movieListClassName);
    fragment.appendChild(listElement);
    visibleMovieContainer.forEach(item => {
        listElement.appendChild(buildMovieItem(item));
    });
    document.body.removeChild(document.querySelector(`.${movieListClassName}`));
    document.body.appendChild(fragment);
} 

const buildMovieItem = (movie) => {
    const listItem = document.createElement('li');
    const nameEl = document.createElement('h5');
    nameEl.textContent = movie.title;
    listItem.appendChild(nameEl);
    const castList = document.createElement('ul');
    movie.cast.forEach(item => {
        castList.appendChild(buildCastItem(item));
    });
    listItem.appendChild(castList);
    return listItem;
}

const buildCastItem = (castItem) => {
    const listItem = document.createElement('li');
    listItem.setAttribute(classAttributeName, castItemClassName);
    const nameEl = document.createElement('span');
    nameEl.textContent = `Name: ${castItem.person.name}`;
    const birthdayEl = nameEl.cloneNode(true);
    birthdayEl.textContent = `Birthday: ${castItem.person.birthday}`;
    const idEl = nameEl.cloneNode(true);
    idEl.textContent = `ID: ${castItem.person.id}`;
    listItem.append(nameEl, birthdayEl, idEl);
    return listItem;
}
})();
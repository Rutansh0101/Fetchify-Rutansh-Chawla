class Fetchify {
    // Implementation of Fetchify class

    // Default configuration of Fetchify
    config = {
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 1000
    };

    // Constructor to initialize Fetchify with user-defined config
    constructor(newConfig) {
        this.#mergeConfig(newConfig);
    }




    // private methods (not accessible outside the class):


    // Private method to dispatch the request, i made this function to reduce redundancy and code reusability.
    async #dispatchRequest({ endPoint, config }) {

        // abort controller is used to abort the request after some time given by the user(timeout).
        const abortController = new AbortController();
        const timeout = config.timeout || this.config.timeout || 0; // get timeout from temp config or default config or set to 0(no timeout).

        // we set a timer to abort the request after the specified timeout duration.
        let timeOutId; // to hold the timeout ID so we can clear it later if needed. If we don't clear it, it may lead to unexpected behavior or memory leaks.
        if (timeout) {
            timeOutId = setTimeout(() => {
                abortController.abort();
            }, timeout);
        }

        // To make this abort functionality work, we need to add the signal from the abort controller to the fetch config. which will tell fetch to listen for abort signals.
        config.signal = abortController.signal; // now fetch will listen for abort signals.

        // Merge temporary config with existing config
        const newConfig = this.#mergeConfigs(this.config, config);
        // console.log(newConfig);


        // fetch is asynchronous, but try catch is synchronous, so we can't use try catch here directly.
        // we used .finally() to clear the timeout after the fetch is complete.
        // but we can use try catch block if we use async await with fetch.
        // Note: Error handling for fetch should be done where this method is called, as fetch returns a promise.



        // promise returned by fetch (Way 1):
        // return fetch(newConfig.baseURL + endPoint, newConfig)
        //     .catch((error) => {
        //         // Handle fetch errors, including abort errors
        //         if (error.name === 'AbortError') {
        //             throw new Error(`Request to ${endPoint} aborted due to timeout after ${timeout} ms`);
        //         } else {
        //             throw error; // rethrow other errors to be handled where this method is called.
        //         }
        //     })
        //     .finally(() => {
        //         // Clear the timeout if the request completes before the timeout duration.
        //         if (timeOutId) {
        //             clearTimeout(timeOutId);
        //         }
        //     });


        // promise returned by fetch (Way 2: using async await):
        try {
            const response = await fetch(newConfig.baseURL + endPoint, newConfig); // wait for the fetch to complete due to await.
            return response; // return the response to be handled where this method is called.
        }
        catch (error) {
            // Handle fetch errors, including abort errors
            if (error.name === 'AbortError') {
                throw new Error(`Request to ${endPoint} aborted due to timeout after ${timeout} ms`);
            } else {
                throw error; // rethrow other errors to be handled where this method is called.
            }
        }
        finally {
            // Clear the timeout if the request completes before the timeout duration.
            if (timeOutId) {
                clearTimeout(timeOutId);
            }
        }
    }

    // Private method to merge user-defined config with default config
    #mergeConfig(newConfig) {
        this.config = {
            ...this.config, // copy of existing config
            ...newConfig, // copy of user-defined config
            headers: { // merge headers specifically
                ...this.config.headers,
                ...newConfig.headers
            }
        };
    }

    // Private method to merge two config objects
    #mergeConfigs(config1, config2) {
        return {
            ...config1,
            ...config2,
            headers: {
                ...config1?.headers,
                ...config2?.headers
            }
        };
    }




    // public methods(user can access these methods):


    // Method to perform GET request
    async get(endPoint, tempConfig = {}) {
        // Call dispatchRequest with method set to GET
        return this.#dispatchRequest({ endPoint, config: { ...tempConfig, method: 'GET' } });
    }


    // Method to perform POST request
    async post(endPoint, tempConfig = {}) {
        // Call dispatchRequest with method set to POST
        return this.#dispatchRequest({ endPoint, config: { ...tempConfig, method: 'POST' } });
    }

}


const create = (config) => {
    // Implementation of fetchify's create method
    return new Fetchify(config);
}

export default {
    create
};
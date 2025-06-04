import {defineStore} from "pinia";

export const useStore = defineStore('store', {
    state: () => (
        {
            tableMap: new Map, // store维护
            tabelData: []
        }
    ),
    actions: {
        setTabelData(data) {
            this.tabelData = data
        },
        addItem(key, value) {
            this.tableMap.set(key, value)
        },
        hasItem(key){
          return this.tableMap.has(key)
        },
        getItem(key) {
            return this.tableMap.get(key);
        },
        deleteItem(key) {
            this.tableMap.delete(key);
        },
        updateItem(key, value) {
            if (this.getItem(key)) {
                this.addItem(key, value);
            }
        }
    },
})

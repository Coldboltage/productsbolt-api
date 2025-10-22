export interface ProductListingsCheckInterface {
  urls: string[];

  existingUrls: string[];

  selectors: {
    listItemNameSelector: string;
    listItemHrefSelector: string;
    priceSelector: string;
    listSelector: string;
  };

  shopId: string;

  urlStructure: string;
}

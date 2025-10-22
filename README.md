## Why it's needed

Productsbolt aims to releave the need to manually check for products constantly from shops while being able to alert the user the product is available from the shop as soon as it's in stock.

## What it is

A Nestjs API / microservice combo which aims to handle the relationship of a product and shops. AI workloads aim to generalise shops/websites, therefore manual investigation of shops aren't required.

## How we want to go about this.

The following is going to be needed to be able to allow the worker microservice to execute it's task correctly while also being able to manage data for the future. This section focuses on the API. At a high level, this is what's required to make Productsbolt work.

- Product Registration (User generated)
- Shop Registration and categorisation (User generated)
- ShopProduct (API Generated)
  - A ShopProduct is a state repersentation of how the shop handles the specific product
- Webpage (API Generated)
- WebpageCache (API Generated)
- Sitemap (API Generated)
- BlackListUrl (User Generated)
- Discord Notification (API Generated)

### Predicted workflow

The user determines what product they are interested in. Shops of interest are added to see if the product exists in the shop. Whenever a shop finds a product, it will populate the ShopProduct, therefore allowing us to know we don't need to check for that shop for said product anymore. Sitemaps are used to identify the best links to attempt to find the product. A WebpageCache determines if we need to process the page further. BlackListUrl is a user generated record if a webpage has been incorrectly identified for the webpage, allowing the system to recheck the shop again for a better product.

## What is deemed successful

For this to be deemed a successful service, Productsbolt needs to remove the need for the user to have to go onto websites at all to check if a product is available. The need for a user to question if Productsbolt is working correctly, is a failure as this leads a user to have to revert to old workflows of manual checking. Productsbolt must be able to find the product if the shop sells the product, and alert the user. While some false positives will exist, excessive false postitives will lead to users ignoring notifications.

- Detection: Stock alert in the first available CRON job category.
- Accuracy: 9/10 accurate.

### Notes

21/10/2025: As of now, Productsbolt API is near completion. Tests are going to be added, state to know if a verification model has checked candidate/webpages and a workflow to identify selectors for webpages automatically will fallback.

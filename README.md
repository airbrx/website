# Airbrx Web Content Repo
This repo is a clone of the published website at https://airbrx.com -- the management of the content is handled with offline tools and checked in for review and version control.  We left the repo public because there isn't really any reason to make it private, and it's a good "live by example" of how modern cloud tools don't have to be overly complicated.

## Why this Architecture?
The Airbx website runs as basic HTML with browser-side javascript functionality.  This website is the end result of a web publishing tool, that is, the content management and the content delivery are two entirely different projects.  Running the company website on a static Cloudfront distribution supports three key tenants of web architecture:  

* Content should be secure (no one can alter it or destroy it maliciously)
* It should be available (it’s there when someone needs to access it)
* It needs to be resilient (it’s not going away because a server got restarted or code was bumped).

As developers rely more and more on AI tools that suggest and help create complex systems, we create more potential for failure. Not only that, but the bad guys are also using complex AI tools that can take advantage of these complex systems in lightning speed.

When there is no reason to add extra libraries, more compute power and complex orchestration… don’t add it. And if the business requirements don’t need all that compute power and complex software development, then don't add it.

## About Airbrx
Our mission is to empower organizations through outcome-driven Data Lakehouse solutions, enabling businesses to innovate, simplify data management, and maximize ROI.

* **Address the Liability of Non-Strategic Infrastructure:**  
We see companies expending significant effort managing complex Spark and Airflow deployments, distracting them from their ability to focus on data analysis and business outcomes.

* **Harness the Power of Managed Platforms:**  
We understand that leveraging managed platforms like Astronomer and Databricks liberate businesses from infrastructure management, allowing them to concentrate on their core competencies.

* **Build Strategic Value:**  
We see a clear demand for a consultancy that not only provides technical expertise but also enables businesses to strategically leverage their data assets.

[Contatct us](https://airbrix.com) to learn more. 

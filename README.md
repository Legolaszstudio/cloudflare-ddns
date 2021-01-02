# Cloudflare Dynamic Dns

A small one file node.js code to automatically update my dns records at cloudflare.
Currently only supports ipv4, ipv6 (records A & AAAA), currently no other compatibility is needed for me, but pull requests are welcome!

## Setup and Installation

Rename the `config.example.json` to `config.json`

### Get and enter your api key
Enter your cloudflare api key to the `cloudflareApiKey` field.

<details>
<summary>How to get an api key?</summary>
<br>
<h3>Easy way</h3>
<div>Navigate to </div><a href="https://dash.cloudflare.com/profile/api-tokens">https://dash.cloudflare.com/profile/api-tokens</a><div> and copy your global api key. I don't recommend this method as we don't need access to every permission.</div>
<br>
<h3>Harder way</h3>
<div>Navigate to </div><a href="https://dash.cloudflare.com/profile/api-tokens">https://dash.cloudflare.com/profile/api-tokens</a><div> and create a new token with permission: </div>
<div>Zone->DNS->Edit</div>
<br>
<div>And select your zone resource you want to use, if you want to use all your zones with one token, then set it to include all zones</div>
<br>
</details>

### Enter your email address
Just enter your cloudflare email address, that you just created a token with, into the `cloudflareEmail` field.

### Enter the zone you want to edit
Just enter the zone name you want the code to edit into the `zone` field. Currently code only supports one zone, but as I said earlier pull requests are welcome.

<details>
<summary>Where can I find my zone name?</summary>
Just go to the cloudflare home page
</details>

## Docker coming soon
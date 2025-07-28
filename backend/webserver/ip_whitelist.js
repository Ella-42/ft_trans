// Redirect whitelisted IPs to the testing environment, blocking everyone else
function check_ip(r)
{
	// Setup the whitelist from our environment variables
	var whitelist =
	[
		process.env.SCHOOL_ETHERNET,
		process.env.SCHOOL_WIFI,
		process.env.ELLA,
		process.env.PCLAUS,
		process.env.PCLAUSMOBILE,
		process.env.KCHEUNG,
	]

	// Check if client's IP is within the whitelist, block if not
	if (!whitelist.includes(r.remoteAddress))
		return r.return(403);
	r.internalRedirect("/test_environment/" + r.uri.slice(5));
	// Otherwise, redirect to the internally served testing environment
}

// Export the 'check_ip' function
export default { check_ip }

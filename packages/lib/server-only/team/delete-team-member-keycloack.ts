import axios from 'axios';
import qs from 'qs';

export const deleteUserFromKeycloakByEmail = async (email: string): Promise<any> => {
  try {
    // Fetch the admin token from Keycloak
    const adminTokenResponse = await axios.post(
      `${process.env.NEXT_PRIVATE_APISIX_URL}/realms/master/protocol/openid-connect/token`,
      qs.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_ID,
        client_secret: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_SECRET,
        scope: 'openid',
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const adminTokenData = adminTokenResponse.data;
    const accessToken = adminTokenData.access_token;

    // Get the user from Keycloak by email
    const usersResponse = await axios.get(
      `${process.env.NEXT_PRIVATE_APISIX_URL}/admin/realms/master/users`, 
      {
        params: { email },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const users = usersResponse.data;
    if (users.length === 0) {
      console.log(`User with email ${email} not found in Keycloak`);
      return `User with email ${email} not found in Keycloak`;
    }

    // Delete the user from Keycloak
    const userId = users[0].id;
    const deleteResponse = await axios.delete(
      `${process.env.NEXT_PRIVATE_APISIX_URL}/admin/realms/master/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return `Successfully deleted user with email ${email} from Keycloak`;
  } catch (error) {
    console.error(`Failed to delete user from Keycloak: ${(error as any).message}`);
    throw new Error(`Failed to delete user from Keycloak`);
  }
};
